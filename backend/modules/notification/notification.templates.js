// Centralized notification templates.
// Every notification type has its title and message defined here.
// To change wording, edit this file — no other module needs to change.

const formatDate = (date) => new Date(date).toLocaleDateString();

const templates = {
  duty_assigned: ({ room, date, startTime, endTime }) => ({
    title: "New Duty Assigned",
    message: `You have been assigned duty at ${room} on ${formatDate(date)} (${startTime}–${endTime})`,
  }),

  duty_cancelled: ({ room, date }) => ({
    title: "Duty Cancelled",
    message: `Your duty at ${room} on ${formatDate(date)} has been cancelled`,
  }),

  request_submitted: ({ type, date }) => ({
    title: "New Change Request",
    message: `A ${type} request has been submitted for duty on ${formatDate(date)}`,
  }),

  request_approved: ({ type, reviewNote }) => ({
    title: "Request Approved",
    message: `Your ${type} request has been approved${reviewNote ? `: ${reviewNote}` : ""}`,
  }),

  request_rejected: ({ type, reviewNote }) => ({
    title: "Request Rejected",
    message: `Your ${type} request has been rejected${reviewNote ? `: ${reviewNote}` : ""}`,
  }),

  duty_swapped: () => ({
    title: "Duty Swap — You Have a New Duty",
    message: "A duty has been swapped to you. Check your duty list for details.",
  }),
};

module.exports = templates;
