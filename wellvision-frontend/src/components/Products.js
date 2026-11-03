import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Products.css';
import SidebarMenu from '../components/SidebarMenu';
import {
  Plus,
  Download,
  Search,
  Grid,
  List,
  Edit2,
  Trash2,
  X,
  Eye
} from 'lucide-react';
import axios from 'axios';

function Products() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if in selection mode
  const queryParams = new URLSearchParams(location.search);
  const isSelectMode = queryParams.get('mode') === 'select';

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);

  // Selection mode state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'eyeglasses',
    brand: '',
    model: '',
    price: '',
    cost: '',
    stock: '',
    reorderLevel: '',
    description: '',
    frameMaterial: '',
    frameColor: '',
    lensType: '',
    prescription: false
  });

  // Spectacle-specific categories
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'eyeglasses', label: 'Eyeglasses' },
    { value: 'sunglasses', label: 'Sunglasses' },
    { value: 'contact-lenses', label: 'Contact Lenses' },
    { value: 'lens', label: 'Lenses' },
    { value: 'accessories', label: 'Accessories' }
  ];

  const brands = [
    { value: 'all', label: 'All Brands' },
    { value: 'ray-ban', label: 'Ray-Ban' },
    { value: 'oakley', label: 'Oakley' },
    { value: 'gucci', label: 'Gucci' },
    { value: 'prada', label: 'Prada' },
    { value: 'versace', label: 'Versace' },
    { value: 'tom-ford', label: 'Tom Ford' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/api/products', {
        withCredentials: true
      });

      if (response.data.success) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // No fallback data - show empty state when database connection fails
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter(product => product.brand === brandFilter);
    }

    // Stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(product => product.stock > product.reorderLevel);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(product => product.stock > 0 && product.stock <= product.reorderLevel);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(product => product.stock === 0);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, stockFilter, brandFilter, products]);

  const getStockStatus = (product) => {
    if (product.stock === 0) return 'out-of-stock';
    if (product.stock <= product.reorderLevel) return 'low-stock';
    return 'in-stock';
  };

  const getStockBadgeText = (product) => {
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock <= product.reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'eyeglasses': '👓',
      'sunglasses': '🕶️',
      'contact-lenses': '👁️',
      'lens': '🔍',
      'accessories': '🎁'
    };
    return icons[category] || '📦';
  };

  const handleViewProduct = (product) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  const handleAddProduct = () => {
    setModalMode('add');
    setFormData({
      name: '',
      category: 'eyeglasses',
      brand: '',
      model: '',
      price: '',
      cost: '',
      stock: '',
      reorderLevel: '',
      description: '',
      frameMaterial: '',
      frameColor: '',
      lensType: '',
      prescription: false
    });
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand,
      model: product.model,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      description: product.description,
      frameMaterial: product.frameMaterial,
      frameColor: product.frameColor,
      lensType: product.lensType,
      prescription: product.prescription
    });
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await axios.delete(`http://localhost:4000/api/products/${productId}`, {
          withCredentials: true
        });

        if (response.data.success) {
          setProducts(products.filter(p => p._id !== productId));
          alert('Product deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        stock: parseInt(formData.stock),
        reorderLevel: parseInt(formData.reorderLevel)
      };

      if (modalMode === 'add') {
        const response = await axios.post('http://localhost:4000/api/products', productData, {
          withCredentials: true
        });

        if (response.data.success) {
          setProducts([...products, response.data.product]);
          alert('Product added successfully!');
        }
      } else {
        const response = await axios.put(`http://localhost:4000/api/products/${selectedProduct._id}`, productData, {
          withCredentials: true
        });

        if (response.data.success) {
          setProducts(products.map(p =>
            p._id === selectedProduct._id ? response.data.product : p
          ));
          alert('Product updated successfully!');
        }
      }

      setShowModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStockFilter('all');
    setBrandFilter('all');
  };

  const exportProducts = () => {
    // In real app, implement CSV export
    alert('Exporting products to CSV...');
  };

  // Selection mode functions
  const handleSelectProduct = (product) => {
    if (selectedProducts.find(p => p._id === product._id)) {
      // Remove from selection
      setSelectedProducts(selectedProducts.filter(p => p._id !== product._id));
      const newQuantities = { ...productQuantities };
      delete newQuantities[product._id];
      setProductQuantities(newQuantities);
    } else {
      // Add to selection with default quantity 1
      setSelectedProducts([...selectedProducts, product]);
      setProductQuantities({
        ...productQuantities,
        [product._id]: 1
      });
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    setProductQuantities({
      ...productQuantities,
      [productId]: Math.max(1, parseInt(quantity) || 1)
    });
  };

  const handleAddSelectedToOrder = () => {
    const selectedItems = selectedProducts.map(product => ({
      productId: product._id,
      sku: product.sku,
      description: product.name,
      quantity: productQuantities[product._id] || 1,
      unitPrice: product.price
    }));

    // Navigate back to orders with selected products
    navigate('/orders', {
      state: { selectedProducts: selectedItems }
    });
  };

  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p._id === productId);
  };

  const totalProducts = products.length;
  const inStockCount = products.filter(p => p.stock > p.reorderLevel).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.reorderLevel).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="products-page">
      <SidebarMenu active="products" />
      
      <div className="products-main-content">
        {/* Header */}
        <div className="products-header">
          <div className="products-header-content">
            <div className="products-header-title">
              <h2>{isSelectMode ? 'Select Products for Order' : 'Products Management'}</h2>
              {isSelectMode ? (
                <div className="selection-info">
                  <span className="stat-badge">Selected: {selectedProducts.length}</span>
                  {selectedProducts.length > 0 && (
                    <span className="stat-badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                      Total: Rs. {selectedProducts.reduce((sum, product) => sum + (product.price * (productQuantities[product._id] || 1)), 0).toLocaleString()}
                    </span>
                  )}
                </div>
              ) : (
                <div className="products-stats">
                  <span className="stat-badge">Total: {totalProducts}</span>
                  <span className="stat-badge" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                    In Stock: {inStockCount}
                  </span>
                  {lowStockCount > 0 && (
                    <span className="stat-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                      Low: {lowStockCount}
                    </span>
                  )}
                  {outOfStockCount > 0 && (
                    <span className="stat-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                      Out: {outOfStockCount}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="products-header-actions">
              {isSelectMode ? (
                <>
                  <button
                    className="export-btn"
                    onClick={() => navigate('/orders')}
                    style={{ backgroundColor: '#6b7280' }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`add-product-btn ${selectedProducts.length === 0 ? 'disabled' : ''}`}
                    onClick={handleAddSelectedToOrder}
                    disabled={selectedProducts.length === 0}
                  >
                    Add to Order ({selectedProducts.length})
                  </button>
                </>
              ) : (
                <>
                  <button className="export-btn" onClick={exportProducts}>
                    <Download size={16} />
                    Export
                  </button>
                  <button className="add-product-btn" onClick={handleAddProduct}>
                    <Plus size={16} />
                    Add Product
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="products-filters">
          <div className="search-filter">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search products, brands, or models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Category:</label>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Brand:</label>
            <select
              className="filter-select"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              {brands.map(brand => (
                <option key={brand.value} value={brand.value}>{brand.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Stock:</label>
            <select
              className="filter-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Content */}
        <div className="products-content">
          <div className="products-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
              Grid View
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List size={16} />
              Table View
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3 className="empty-state-title">No products found</h3>
              <p className="empty-state-description">
                {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all' || brandFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first product'}
              </p>
              {!(searchQuery || categoryFilter !== 'all' || stockFilter !== 'all' || brandFilter !== 'all') && (
                <button className="add-product-btn" onClick={handleAddProduct}>
                  <Plus size={16} />
                  Add Your First Product
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product._id} className={`product-card ${isSelectMode && isProductSelected(product._id) ? 'selected' : ''}`}>
                  {isSelectMode && (
                    <div className="product-selection">
                      <input
                        type="checkbox"
                        checked={isProductSelected(product._id)}
                        onChange={() => handleSelectProduct(product)}
                        className="product-checkbox"
                      />
                      {isProductSelected(product._id) && (
                        <div className="quantity-selector">
                          <label>Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={productQuantities[product._id] || 1}
                            onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                            className="quantity-input"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="product-image-container">
                    <div className="product-placeholder">
                      {getCategoryIcon(product.category)}
                    </div>
                    <span className={`product-badge badge-${getStockStatus(product)}`}>
                      {getStockBadgeText(product)}
                    </span>
                  </div>
                  <div className="product-card-content">
                    <div className="product-category">
                      {categories.find(c => c.value === product.category)?.label}
                    </div>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-details">
                      <span className="product-price">
                        Rs. {product.price.toLocaleString()}
                      </span>
                      <span className="product-stock">
                        Stock: <span>{product.stock}</span>
                      </span>
                    </div>
                    <div className="product-actions">
                      {isSelectMode ? (
                        <button
                          className="action-btn select-action-btn"
                          onClick={() => handleSelectProduct(product)}
                        >
                          {isProductSelected(product._id) ? 'Selected' : 'Select'}
                        </button>
                      ) : (
                        <>
                          <button
                            className="action-btn view-action-btn"
                            onClick={() => handleViewProduct(product)}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            className="action-btn edit-action-btn"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            className="action-btn delete-action-btn"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    {isSelectMode && <th>Select</th>}
                    <th>Product</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    {!isSelectMode && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product._id} className={isSelectMode && isProductSelected(product._id) ? 'selected-row' : ''}>
                      {isSelectMode && (
                        <td>
                          <div className="table-selection">
                            <input
                              type="checkbox"
                              checked={isProductSelected(product._id)}
                              onChange={() => handleSelectProduct(product)}
                              className="table-checkbox"
                            />
                            {isProductSelected(product._id) && (
                              <div className="table-quantity">
                                <label>Qty:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={productQuantities[product._id] || 1}
                                  onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                                  className="table-quantity-input"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="table-product-info">
                          <div className="table-product-image">
                            <div className="table-product-icon">
                              {getCategoryIcon(product.category)}
                            </div>
                          </div>
                          <div className="table-product-details">
                            <p className="table-product-name">{product.name}</p>
                            <p className="table-product-category">
                              {product.frameMaterial} {product.frameColor && `• ${product.frameColor}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{categories.find(c => c.value === product.category)?.label}</td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {brands.find(b => b.value === product.brand)?.label}
                      </td>
                      <td>{product.model}</td>
                      <td style={{ fontWeight: 600, color: '#0d9488' }}>
                        Rs. {product.price.toLocaleString()}
                      </td>
                      <td>{product.stock}</td>
                      <td>
                        <span className={`product-badge badge-${getStockStatus(product)}`}>
                          {getStockBadgeText(product)}
                        </span>
                      </td>
                      {!isSelectMode && (
                        <td>
                          <div className="table-actions">
                            <button
                              className="table-action-btn edit-action-btn"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                              className="table-action-btn delete-action-btn"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Product Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Category <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      {categories.filter(c => c.value !== 'all').map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Brand <span className="required">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Brand</option>
                      {brands.filter(b => b.value !== 'all').map(brand => (
                        <option key={brand.value} value={brand.value}>{brand.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Model Number</label>
                  <input
                    type="text"
                    className="form-input"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Selling Price (Rs.) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Cost Price (Rs.) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Stock Quantity <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reorder Level</label>
                    <input
                      type="number"
                      className="form-input"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Frame Material</label>
                    <input
                      type="text"
                      className="form-input"
                      name="frameMaterial"
                      value={formData.frameMaterial}
                      onChange={handleInputChange}
                      placeholder="e.g., Metal, Plastic, Acetate"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Frame Color</label>
                    <input
                      type="text"
                      className="form-input"
                      name="frameColor"
                      value={formData.frameColor}
                      onChange={handleInputChange}
                      placeholder="e.g., Black, Gold, Tortoise"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lens Type</label>
                  <input
                    type="text"
                    className="form-input"
                    name="lensType"
                    value={formData.lensType}
                    onChange={handleInputChange}
                    placeholder="e.g., Clear, Polarized, Blue Light Filter"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="prescription"
                      checked={formData.prescription}
                      onChange={handleInputChange}
                    />
                    <span className="form-label" style={{ margin: 0 }}>Prescription Available</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn modal-btn-submit">
                  {modalMode === 'add' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {showViewModal && viewingProduct && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Product Details</h3>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="product-details-grid">
                <div className="product-image-section">
                  <div className="product-large-image">
                    {getCategoryIcon(viewingProduct.category)}
                  </div>
                  <span className={`product-badge badge-${getStockStatus(viewingProduct)}`}>
                    {getStockBadgeText(viewingProduct)}
                  </span>
                </div>

                <div className="product-info-section">
                  <div className="product-basic-info">
                    <h2 className="product-detail-name">{viewingProduct.name}</h2>
                    <p className="product-detail-category">
                      {categories.find(c => c.value === viewingProduct.category)?.label}
                    </p>
                    <p className="product-detail-brand">
                      Brand: {brands.find(b => b.value === viewingProduct.brand)?.label}
                    </p>
                    {viewingProduct.model && (
                      <p className="product-detail-model">Model: {viewingProduct.model}</p>
                    )}
                  </div>

                  <div className="product-pricing-info">
                    <div className="price-display">
                      <span className="selling-price">Rs. {viewingProduct.price.toLocaleString()}</span>
                      <span className="cost-price">Cost: Rs. {viewingProduct.cost.toLocaleString()}</span>
                    </div>
                    <div className="stock-info">
                      <span className="stock-quantity">Stock: {viewingProduct.stock}</span>
                      {viewingProduct.reorderLevel > 0 && (
                        <span className="reorder-level">Reorder Level: {viewingProduct.reorderLevel}</span>
                      )}
                    </div>
                  </div>

                  <div className="product-specifications">
                    <h4>Specifications</h4>
                    <div className="specs-grid">
                      {viewingProduct.frameMaterial && (
                        <div className="spec-item">
                          <span className="spec-label">Frame Material:</span>
                          <span className="spec-value">{viewingProduct.frameMaterial}</span>
                        </div>
                      )}
                      {viewingProduct.frameColor && (
                        <div className="spec-item">
                          <span className="spec-label">Frame Color:</span>
                          <span className="spec-value">{viewingProduct.frameColor}</span>
                        </div>
                      )}
                      {viewingProduct.lensType && (
                        <div className="spec-item">
                          <span className="spec-label">Lens Type:</span>
                          <span className="spec-value">{viewingProduct.lensType}</span>
                        </div>
                      )}
                      <div className="spec-item">
                        <span className="spec-label">Prescription:</span>
                        <span className="spec-value">{viewingProduct.prescription ? 'Available' : 'Not Available'}</span>
                      </div>
                    </div>
                  </div>

                  {viewingProduct.description && (
                    <div className="product-description-section">
                      <h4>Description</h4>
                      <p className="product-description-text">{viewingProduct.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="modal-btn modal-btn-submit"
                onClick={() => {
                  setShowViewModal(false);
                  handleEditProduct(viewingProduct);
                }}
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
