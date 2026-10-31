# SunFlow AI demonstration checklist

Runtime verification is pending deployment. These are acceptance steps, not a record of passed tests.

## Preparation

- Open the deployed HTTPS site. Confirm DEMO MODE, the ten fictional customers, five quotations/orders/installations/tickets, and ten catalog products.
- Use Settings → Reset Demo Data and confirm the reset. Switch through the account menu's six roles, confirming that only relevant modules appear. Return to Admin / Director.
- Use All Time when showing historical records. The demonstration uses your own isolated database workspace.

## Full workflow (5–7 minutes)

1. Customers & Leads → New enquiry: use a unique fictional 10-digit phone, 3 kW On-Grid requirement, and select a sales executive. Confirm the lead appears immediately on the dashboard.
2. Site Surveys → Schedule survey: select that customer, assign a technician, and record roof details. Open the survey; choose In Progress, Submitted, then Approved. Approval is available to Admin / Director and Survey Technician.
3. Quotations → Create quotation: select the approved survey and the configured 3 kW On-Grid demonstration package. Enter installation charge, tax, discount, subsidy information, and a future validity date. Confirm the calculated line items and total. Download/print the PDF, mark Sent, then Accept & create order.
4. Orders → open the new order → Record payment: enter at least 40% of its total (or the configured advance), a unique reference, and a date. Download the payment receipt from Recent payments. Confirm that cash receipts do not increase sales revenue a second time.
5. Open the order → Reserve inventory. Confirm products' available quantities fall while physical quantities remain. Copy the reserved serial number list displayed in the order details. Dispatch equipment, entering each serial once; on supported browsers demonstrate the camera scanner. Physical stock now falls and serials become Dispatched. Confirm delivery and recipient.
6. Installations → Schedule installation: select the order and an available crew lead/date. Open the job → Start installation. Choose Complete & activate warranties, check all three mandatory items, record generation test results, upload a real non-sensitive sample photograph, and type the customer's acceptance name. Confirm the order and installation become Completed and download the completion report.
7. Warranty: locate the new customer/equipment. Confirm the start is today's completion date and expiry uses the configured product duration. Non-serialized components have internal asset tags. As admin, correct a date with a reason; confirm the audit trail records it.
8. Service Tickets → Raise a ticket: select the customer and an installed serial belonging to that customer. For active coverage, confirm parts and labour charges become zero. Progress Open → Assigned → In Progress → Resolved, providing notes. Closing without customer confirmation must fail; confirm customer acceptance and close. Inspect the serial's service history.
9. Finance & Reports: record an installation expense linked to the new order, then inspect its revenue, committed materials, expenses, projected profit, margin, and payment balance. Export CSV. The original approved order total is counted once.
10. Refresh: confirm the new records remain. Open the floating assistant and ask about pending installations or low stock. An unavailable AI service must display a clear error while manual search remains functional.

## Negative cases

- Reuse a customer phone or inventory serial: save must fail.
- Quote an unapproved survey or a package without a configured BOM: disallowed.
- Accept an expired quotation or accept the same quotation twice: disallowed.
- Record an overpayment, duplicate payment reference, or refund exceeding receipts: rejected.
- Reserve more than unreserved stock or dispatch without the minimum advance: rejected without partial writes.
- Dispatch a wrong or duplicate serial: rejected. Verify no negative stock.
- Schedule the same crew lead twice on the same day: rejected.
- Start before dispatch or complete without photos/checklists/acceptance: rejected.
- Raise a ticket for equipment belonging to a different customer: rejected.
- Close a service ticket without customer confirmation: rejected.
- As Service Technician, attempt finance, warranty corrections, stock dispatch, or business settings changes: denied on server.
- Switch roles and confirm chat history clears. Demo role switching must not alter live account permissions.

## Additional functions

- Receive serial-tracked stock; confirm one unique serial per purchased unit and supplier payables update.
- Settle supplier payables and verify material expenses are not counted twice.
- Configure another package BOM; verify the quotation uses exact configured quantities.
- Record a warranty coverage exception as administrator and review the reason in the audit trail.
- Replace installed equipment from available stock. Confirm old serial/warranty become Replaced, replacement serial becomes Installed, stock decreases, and expiry remains the original coverage end date.
- Update subsidy paperwork and confirm it stays separate from sales revenue.
- Exercise Today/This Week/This Month/Custom/All Time filters, searches, CSV/PDF downloads, and empty states.
- Check layout at phone, tablet, and desktop widths, including menu collapse, forms, tables, assistant, and private photos.
- Invite a live administrator via Identity, accept the invite, sign in, assign a staff member, sign out/in, and verify organization isolation. Live workspaces start without demo sample data.
