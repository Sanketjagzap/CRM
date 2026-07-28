const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { Lead } = require('../models/Lead');
const { Contact } = require('../models/Contact');
const { Company } = require('../models/Company');
const { Deal } = require('../models/Deal');
const { logActivity } = require('../services/activity.service');

const convertLead = asyncHandler(async (request, response) => {
  const { id } = request.params;
  const ownerId = request.user.id;
  let { createDeal = true, dealTitle, dealValue, dealStage = 'new_lead', probability = 10, expectedCloseDate, assignedTo } = request.body;

  if (expectedCloseDate === '' || expectedCloseDate === null || expectedCloseDate === undefined) {
    expectedCloseDate = null;
  }
  if (dealValue === '' || dealValue === null || dealValue === undefined) {
    dealValue = null;
  } else if (dealValue != null) {
    dealValue = Number(dealValue);
  }
  if (probability === '' || probability === null || probability === undefined) {
    probability = 10;
  } else if (probability != null) {
    probability = Number(probability);
  }

  const lead = await Lead.findById(id);
  if (!lead) throw new ApiError(404, 'Lead not found');
  if (lead.converted) throw new ApiError(400, 'Lead already converted');

  const created = { company: null, contact: null, deal: null };
  const companyIsNew = !!(lead.company && lead.company.trim());

  try {
    if (lead.company && lead.company.trim()) {
      const existingCompany = await Company.findOne({
        owner: ownerId,
        name: { $regex: new RegExp(`^${lead.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (existingCompany) {
        created.company = existingCompany;
      } else {
        created.company = await Company.create({
          name: lead.company,
          email: lead.email,
          phone: lead.phone,
          owner: ownerId,
          assignedTo: assignedTo || lead.assignedTo || ownerId,
          address: {
            street: lead.address?.street || '',
            city: lead.address?.city || '',
            state: lead.address?.state || '',
            zip: lead.address?.zip || '',
            country: lead.address?.country || '',
          },
        });
      }
    }

    created.contact = await Contact.create({
      name: lead.name,
      firstName: lead.name.split(' ')[0] || '',
      lastName: lead.name.split(' ').slice(1).join(' ') || '',
      company: lead.company,
      companyId: created.company?._id || null,
      email: lead.email,
      phone: lead.phone,
      owner: ownerId,
      assignedTo: assignedTo || lead.assignedTo || ownerId,
      leadSource: lead.source,
      jobTitle: lead.jobTitle || '',
      address: {
        street: lead.address?.street || '',
        city: lead.address?.city || '',
        state: lead.address?.state || '',
        zip: lead.address?.zip || '',
        country: lead.address?.country || '',
      },
    });

    if (createDeal) {
      const finalDealTitle = dealTitle || `${lead.name} - Deal`;
      created.deal = await Deal.create({
        title: finalDealTitle,
        contact: created.contact._id,
        company: created.company?._id || null,
        lead: lead._id,
        stage: dealStage,
        value: dealValue || lead.value || 0,
        finalAmount: dealValue || lead.value || 0,
        probability,
        expectedCloseDate,
        owner: ownerId,
        assignedTo: assignedTo || lead.assignedTo || ownerId,
      });

      created.contact.deals = created.contact.deals || [];
      created.contact.deals.push(created.deal._id);
      await created.contact.save();
    }

    lead.converted = true;
    lead.convertedAt = new Date();
    lead.status = 'won';
    lead.stage = 'won';
    lead.convertedToContact = created.contact._id;
    if (created.company) lead.convertedToCompany = created.company._id;
    if (created.deal) lead.convertedToDeal = created.deal._id;
    await lead.save();

    try {
      await logActivity({
        actor: ownerId,
        type: 'convert',
        entityType: 'lead',
        entityId: lead._id,
        title: `Lead converted`,
        description: `Lead "${lead.name}" converted to Contact${created.company ? ' + Company' : ''}${created.deal ? ' + Deal' : ''}`,
        meta: { contactId: created.contact._id, companyId: created.company?._id, dealId: created.deal?._id },
      });
    } catch (activityErr) {
      console.warn('Activity log failed after lead conversion (non-fatal):', activityErr.message);
    }

    response.json({
      success: true,
      message: 'Lead converted successfully',
      data: { lead, contact: created.contact, company: created.company, deal: created.deal },
    });
  } catch (error) {
    const cleanup = [];
    if (created.deal) cleanup.push(Deal.findByIdAndDelete(created.deal._id).catch(() => {}));
    if (created.contact) cleanup.push(Contact.findByIdAndDelete(created.contact._id).catch(() => {}));
    if (created.company && companyIsNew) cleanup.push(Company.findByIdAndDelete(created.company._id).catch(() => {}));
    try {
      await Promise.all(cleanup);
    } catch (cleanupErr) {
      console.warn('[convertLead] best-effort cleanup warning:', cleanupErr.message);
    }
    throw error;
  }
});

module.exports = { convertLead };
