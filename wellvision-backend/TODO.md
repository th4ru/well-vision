# Backend Invoice Implementation TODO

## Steps to Complete End-to-End Invoice Save

### 1. Update Invoice Model (invoiceModel.js)
- Change amount, advance, balance to Number type
- Change rs, cts in itemSchema to Number type
- Ensure date is properly cast to Date

### 2. Update Invoice Controller (invoiceController.js)
- Modify createInvoice to generate formatted billNo (e.g., INV-0737) using getNextSequence
- Coerce numeric fields (amount, advance, balance, rs, cts) to Number
- Handle date casting from YYYY-MM-DD string to Date
- Remove auto-generation of billNo in controller since it's now formatted

### 3. Update Frontend Invoice Component (WellVisionInvoice.js)
- Change initial billNo fetch to use /api/invoices/preview-bill-no (does not increment)
- Keep /api/invoices/next-bill-no after successful save (increments for next invoice)

### 4. Verify Backend Setup (index.js)
- Confirm /api/invoices routes are mounted
- Ensure CORS allows localhost:3000
- Verify MongoDB connection is configured

### 5. Testing
- Start backend server on port 4000
- Test invoice creation with Ctrl+S
- Verify billNo increments correctly
- Check MongoDB for saved invoices
