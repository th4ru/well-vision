import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './WellVisionInvoice.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const WellVisionInvoice = ({ customer }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('view') ? 'view' : searchParams.get('edit') ? 'edit' : 'create';
  const invoiceId = searchParams.get('view') || searchParams.get('edit');
  const customerId = searchParams.get('customerId');
  const orderNo = searchParams.get('orderNo');
  const customerNameParam = searchParams.get('customerName');
  const customerEmailParam = searchParams.get('customerEmail');
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    orderNo: '',
    date: new Date().toISOString().split('T')[0],
    billNo: '',
    name: '',
    tel: '',
    address: '',
    items: Array(4).fill(null).map(() => ({ item: '', description: '', rs: '', cts: '' })),
    amount: '',
    advance: '',
    balance: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch invoice data if in view or edit mode
  useEffect(() => {
    if (mode === 'create') {
      const fetchNumbers = async () => {
        try {
          // Bill number preview
          const billRes = await fetch('http://localhost:4000/api/invoices/preview-bill-no');
          const billData = await billRes.json();

          // Order number preview
          const orderRes = await fetch('http://localhost:4000/api/orders/preview-order-no');
          const orderData = await orderRes.json();

          setFormData(prev => ({
            ...prev,
            billNo: billData.success ? billData.nextBillNo : prev.billNo,
            orderNo: orderData.success ? orderData.nextOrderNumber : prev.orderNo,
          }));

          if (!billData.success) {
            toast.error(billData.message || 'Failed to load Bill No');
          }
          if (!orderData.success) {
            toast.error(orderData.message || 'Failed to load Order No');
          }
        } catch (err) {
          toast.error('Error fetching invoice/order numbers');
          console.error(err);
        }
      };

      fetchNumbers();
    } else if (invoiceId) {
      const fetchInvoice = async () => {
        try {
          const response = await fetch(`http://localhost:4000/api/invoices/${invoiceId}`, {
            credentials: 'include',
          });
          const data = await response.json();
          if (data.success) {
            const invoice = data.invoice;
            setFormData({
              orderNo: invoice.orderNo || '',
              date: invoice.date ? new Date(invoice.date).toISOString().slice(0, 10) : '',
              billNo: invoice.billNo || '',
              name: invoice.name || '',
              tel: invoice.tel || '',
              address: invoice.address || '',
              items: invoice.items && invoice.items.length > 0 ? invoice.items.map(item => ({
                item: item.item || '',
                description: item.description || '',
                rs: item.rs || '',
                cts: item.cts || '',
              })) : Array(4).fill(null).map(() => ({ item: '', description: '', rs: '', cts: '' })),
              amount: invoice.amount || '',
              advance: invoice.advance || '',
              balance: invoice.balance || '',
            });
          } else {
            toast.error('Failed to load invoice');
          }
        } catch (error) {
          toast.error('Error loading invoice');
          console.error(error);
        }
      };

      fetchInvoice();
    }
  }, [mode, invoiceId]);

  // Auto-fill invoice header when a customer is provided (Customer Profile Billing)
  useEffect(() => {
    if (!customer) return;
    setFormData(prev => ({
      ...prev,
      name: prev.name || `${customer.givenName || ''} ${customer.familyName || ''}`.trim(),
      tel: prev.tel || customer.phoneNo || '',
      address: prev.address || customer.address || '',
    }));
  }, [customer]);

  // Auto-fill invoice from order parameters
  useEffect(() => {
    if (orderNo || customerNameParam || customerEmailParam) {
      setFormData(prev => ({
        ...prev,
        orderNo: orderNo || prev.orderNo || '',
        billNo: orderNo || prev.billNo || '',
        name: prev.name || customerNameParam || '',
        tel: prev.tel || customerEmailParam || '', // Using email as tel for now, adjust if needed
        date: prev.date || new Date().toISOString().split('T')[0], // Auto-fill current date
      }));
    }
  }, [orderNo, customerNameParam, customerEmailParam]);

  // Recalculate amount & balance when items or advance changes
  useEffect(() => {
    const total = formData.items.reduce((acc, curr) => {
      const rs = parseFloat(curr.rs) || 0;
      const cts = parseFloat(curr.cts) || 0;
      return acc + rs + cts / 100;
    }, 0);

    const advance = parseFloat(formData.advance) || 0;
    const balance = total - advance;

    setFormData(prev => ({
      ...prev,
      amount: total.toFixed(2),
      balance: balance.toFixed(2),
    }));
  }, [formData.items, formData.advance]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.billNo.trim()) newErrors.billNo = 'Bill No is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.tel.trim()) {
      newErrors.tel = 'Telephone number is required';
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.tel)) {
      newErrors.tel = 'Enter a valid telephone number';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    const validItems = formData.items.some(
      item => item.item.trim() !== ''
    );
    if (!validItems) newErrors.items = 'At least one item is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.date, formData.billNo, formData.name, formData.tel, formData.address, formData.items]);

  const handleChange = (e, index, field) => {
    const { value } = e.target;

    if (index !== undefined) {
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
      setFormData(prev => ({ ...prev, items: updatedItems }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error on change
    if (field && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'items' && errors.items) {
      setErrors(prev => ({ ...prev, items: '' }));
    }
  };

  const renderLineInput = (value, onChange, width = '200px', error = false, type = 'text', name = '') => (
    <input
      type={type}
      name={name}
      value={value}
      onChange={mode === 'view' ? undefined : onChange}
      readOnly={mode === 'view'}
      style={{
        border: 'none',
        borderBottom: error ? '2px solid red' : '1px dotted black',
        outline: 'none',
        width,
        background: 'transparent',
      }}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${name}-error` : undefined}
      step={type === 'number' ? 'any' : undefined}
      min={type === 'number' ? '0' : undefined}
      autoComplete="off"
    />
  );

  const saveInvoice = useCallback(
    async (options = { resetAfterSave: true }) => {
      const { resetAfterSave } = options;

      if (mode === 'view') return { success: true };

      if (!validateForm()) {
        toast.warning('Please fix form errors before submitting.');
        return { success: false };
      }
      setIsSubmitting(true);
      try {
        const payload = { ...formData };
        if (customer && customer._id) {
          payload.customerId = customer._id;
        }

        console.log('Sending payload:', JSON.stringify(payload, null, 2));
        const url = mode === 'edit' && invoiceId ? `http://localhost:4000/api/invoices/${invoiceId}` : 'http://localhost:4000/api/invoices/create';
        const method = mode === 'edit' ? 'PUT' : 'POST';
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        if (response.ok && data.success) {
          toast.success(`Invoice ${mode === 'edit' ? 'updated' : 'saved'} successfully!`);

          if (resetAfterSave && mode === 'create') {
            setFormData({
              orderNo: '',
              date: new Date().toISOString(),
              billNo: '',
              name: '',
              tel: '',
              address: '',
              items: Array(4).fill(null).map(() => ({ item: '', description: '', rs: '', cts: '' })),
              amount: '',
              advance: '',
              balance: '',
            });
            setErrors({});

            const res = await fetch('http://localhost:4000/api/invoices/next-bill-no', {
              credentials: 'include',
            });
            const data2 = await res.json();
            if (data2.success) {
              setFormData(prev => ({ ...prev, billNo: data2.nextBillNo }));
            }
          } else if (mode === 'edit') {
            // Navigate back to bills page after successful update
            setTimeout(() => {
              if (customerId) {
                navigate(`/customer/${customerId}?tab=Bills`);
              } else if (customer) {
                navigate(-1);
              } else {
                navigate('/bills');
              }
            }, 2000); // 2 second delay to show the success message
          }

          return { success: true, invoice: data.invoice };
        } else {
          toast.error(`Failed to ${mode === 'edit' ? 'update' : 'save'} invoice: ` + (data.message || 'Unknown error'));
          return { success: false };
        }
      } catch (error) {
        toast.error(`Error ${mode === 'edit' ? 'updating' : 'saving'} invoice: ` + error.message);
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, customer, validateForm, mode, invoiceId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveInvoice();
  };

  // Keyboard shortcuts: Ctrl/Cmd+S to save, Ctrl/Cmd+P to print, Ctrl/Cmd+Z to go back
  useEffect(() => {
    const onKeyDown = async (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const saveCombo =
        (isMac && e.metaKey && e.key.toLowerCase() === 's') ||
        (!isMac && e.ctrlKey && e.key.toLowerCase() === 's');
      const printCombo =
        (isMac && e.metaKey && e.key.toLowerCase() === 'p') ||
        (!isMac && e.ctrlKey && e.key.toLowerCase() === 'p');
      const backCombo =
        (isMac && e.metaKey && e.key.toLowerCase() === 'z') ||
        (!isMac && e.ctrlKey && e.key.toLowerCase() === 'z');

      if (saveCombo) {
        e.preventDefault();
        if (!isSubmitting) await saveInvoice();
      } else if (printCombo) {
        e.preventDefault();
        if (!isSubmitting) {
          const result = await saveInvoice({ resetAfterSave: false });
          if (result && result.success) {
            window.print();
          }
        }
      } else if (backCombo) {
        e.preventDefault();
        if (customerId) {
          navigate(`/customer/${customerId}?tab=Bills`);
        } else if (customer) {
          navigate(-1);
        } else {
          navigate('/bills');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveInvoice, isSubmitting, navigate]);

  const handlePrint = async () => {
    if (isSubmitting) return;
    const result = await saveInvoice({ resetAfterSave: false });
    if (result && result.success) {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (isSubmitting) return;
    const result = await saveInvoice({ resetAfterSave: false });
    if (result && result.success) {
      try {
        const element = formRef.current;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#fff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const imgAspectRatio = imgWidth / imgHeight;
        const pdfAspectRatio = pdfWidth / pdfHeight;

        let finalWidth, finalHeight;
        if (imgAspectRatio > pdfAspectRatio) {
          // Image is wider, fit to width
          finalWidth = pdfWidth;
          finalHeight = pdfWidth / imgAspectRatio;
        } else {
          // Image is taller, fit to height
          finalHeight = pdfHeight;
          finalWidth = pdfHeight * imgAspectRatio;
        }

        const imgX = (pdfWidth - finalWidth) / 2;
        const imgY = 0;

        pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);
        pdf.save(`invoice-${formData.billNo || 'draft'}.pdf`);
        toast.success('PDF downloaded successfully!');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF');
      }
    }
  };

  return (
    <form ref={formRef} className="bill-container" onSubmit={handleSubmit} noValidate>
      <div className="header">
        <div className="logo-section">
          <img src="/Logo Red.png" alt="Well Vision Logo" className="logo" />
          <div>
            <h1>WELL VISION</h1>
            <p className="tagline">THE PATH TO CLEAR VISION</p>
            <p className="br-number">BR.No. PV00281194</p>
            <div className="services-box">
              <div className="services">
                Specialized eye channelling + Investigation, theater, glaucoma diagnosis + Treatment, computerized <br />
                eye testing + optical paradise, Spectacle Frames, Lenses, Contact Lenses + Colour Contact Lenses, Sun Glasses
              </div>
            </div>
          </div>
        </div>
        <div className="contact-section">
          <p>Kalawewa Junction, Galewela</p>
          <p>+94 664336709 / +94 777 136 79</p>
          <p>wellvision.lk@gmail.com</p>
        </div>
      </div>

      <div className="info-row">
        <span>
          Order No :{' '}
          {renderLineInput(
            formData.orderNo,
            e => handleChange(e, undefined, 'orderNo'),
            '200px',
            !!errors.orderNo,
            'text',
            'orderNo'
          )}
          {errors.orderNo && <div id="orderNo-error" className="error-message">{errors.orderNo}</div>}
        </span>
        <span>
          Date :{' '}
          {renderLineInput(
            formData.date,
            e => handleChange(e, undefined, 'date'),
            '200px',
            !!errors.date,
            'date',
            'date'
          )}
          {errors.date && <div id="date-error" className="error-message">{errors.date}</div>}
        </span>
        <span>
          Bill No :{' '}
          {renderLineInput(
            formData.billNo,
            e => handleChange(e, undefined, 'billNo'),
            '150px',
            !!errors.billNo,
            'text',
            'billNo'
          )}
          {errors.billNo && <div id="billNo-error" className="error-message">{errors.billNo}</div>}
        </span>
      </div>

      <div className="info-row">
        <span>
          Name :{' '}
          {renderLineInput(
            formData.name,
            e => handleChange(e, undefined, 'name'),
            '590px',
            !!errors.name,
            'text',
            'name'
          )}
          {errors.name && <div id="name-error" className="error-message">{errors.name}</div>}
        </span>
        <span>
          Tel :{' '}
          {renderLineInput(
            formData.tel,
            e => handleChange(e, undefined, 'tel'),
            '150px',
            !!errors.tel,
            'tel',
            'tel'
          )}
          {errors.tel && <div id="tel-error" className="error-message">{errors.tel}</div>}
        </span>
      </div>

      <div className="info-row">
        <span>
          Address :{' '}
          {renderLineInput(
            formData.address,
            e => handleChange(e, undefined, 'address'),
            '580px',
            !!errors.address,
            'text',
            'address'
          )}
          {errors.address && <div id="address-error" className="error-message">{errors.address}</div>}
        </span>
      </div>

      <br />
      <table className="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Rs.</th>
            <th>Cts.</th>
          </tr>
        </thead>
        <tbody>
          {formData.items.map((row, i) => (
            <tr key={i}>
              <td>
                {renderLineInput(row.item, e => handleChange(e, i, 'item'), '150px', false, 'text', `item-${i}`)}
              </td>
              <td>
                {renderLineInput(row.description, e => handleChange(e, i, 'description'), '250px', false, 'text', `description-${i}`)}
              </td>
              <td>
                {renderLineInput(row.rs, e => handleChange(e, i, 'rs'), '60px', !!errors.items, 'number', `rs-${i}`)}
              </td>
              <td>
                {renderLineInput(row.cts, e => handleChange(e, i, 'cts'), '60px', false, 'number', `cts-${i}`)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {errors.items && <div className="error-message" style={{ marginBottom: '10px' }}>{errors.items}</div>}

      <div className="footer-section">
        <div className="signature">
          ...............................................................
          <br />
          Signature
        </div>
        <div className="amounts">
          <p>
            Amount{' '}
            {renderLineInput(
              formData.amount,
              () => {}, // no onChange, readonly
              '150px',
              !!errors.amount,
              'text',
              'amount'
            )}
            {errors.amount && <div id="amount-error" className="error-message">{errors.amount}</div>}
          </p>
          <p>
            Advance{' '}
            {renderLineInput(
              formData.advance,
              e => handleChange(e, undefined, 'advance'),
              '150px',
              !!errors.advance,
              'number',
              'advance'
            )}
            {errors.advance && <div id="advance-error" className="error-message">{errors.advance}</div>}
          </p>
          <p>
            Balance{' '}
            {renderLineInput(
              formData.balance,
              () => {}, // no onChange, readonly
              '150px',
              !!errors.balance,
              'text',
              'balance'
            )}
            {errors.balance && <div id="balance-error" className="error-message">{errors.balance}</div>}
          </p>
        </div>
      </div>

      <div className="notice">
        <p>
          Please note that your confirmed order cannot be changed or cancelled. Advance paid would not be refunded
        </p>
        <p className="sinhala">
          **********************************sinhala content**********************************
        </p>
        <p className="notice-bottom">
          We do not hold responsibility to any orders not removed within 3 months
          <br />
          Items once sold cannot be returned
        </p>
        <p className="sinhala">
          **********************************sinhala content**********************************
        </p>
      </div>

      <div className="galewela">Galewela</div>

      <div className="invoice-actions">
        {mode !== 'view' && (
          <button
            className="save-button"
            type="button"
            onClick={() => saveInvoice()}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save'}
          </button>
        )}
        <button
          className="print-button"
          type="button"
          onClick={handlePrint}
        >
          Print
        </button>
        <button
          className="pdf-button"
          type="button"
          onClick={handleDownloadPDF}
        >
          Download PDF
        </button>
        {mode === 'view' && (
          <button
            className="back-button"
            type="button"
            onClick={() => {
              if (customerId) {
                navigate(`/customer/${customerId}?tab=Bills`);
              } else if (customer) {
                navigate(-1);
              } else {
                navigate('/bills');
              }
            }}
          >
            Back
          </button>
        )}
      </div>
    </form>
  );
};

export default WellVisionInvoice;
