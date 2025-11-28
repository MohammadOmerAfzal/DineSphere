import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Trash2, Plus } from 'lucide-react';
import '../../Styles/RestaurantRegisterPage.css';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const RestaurantRegisterPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        basicInfo: { 
            name: '', 
            description: '', 
            cuisineType: [], 
            logo: '', 
            bannerImages: [], 
            tags: [] 
        },
        contact: { 
            email: '', 
            phone: '', 
            website: '' 
        },
        address: { 
            addressLine1: '', 
            addressLine2: '', 
            city: '', 
            state: '', 
            postalCode: '', 
            country: '' 
        },
        businessHours: daysOfWeek.map((_, idx) => ({ 
            day: idx, 
            openingTime: '', 
            closingTime: '', 
            isOpen: false 
        })),
        menuItems: [], // Menu items at root level to match backend schema
        settings: { 
            deliveryFee: 0, 
            minimumOrder: 0, 
            preparationTime: 0, 
            deliveryRadius: 0, 
            isActive: true, 
            isAcceptingOrders: true, 
            paymentMethods: [] 
        },
        verification: { 
            documents: [], 
            isVerified: false 
        }
    });

    const [newMenuItem, setNewMenuItem] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image: ''
    });

    const steps = ['Basic Info', 'Menu Setup', 'Settings & Payment'];

    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    };

    const handleBusinessHourChange = (index, field, value) => {
        const updated = [...formData.businessHours];
        updated[index][field] = value;
        setFormData(prev => ({ ...prev, businessHours: updated }));
    };

    const handleMenuItemChange = (field, value) => {
        setNewMenuItem(prev => ({ ...prev, [field]: value }));
    };

    const handleAddMenuItem = () => {
        if (newMenuItem.name && newMenuItem.price && newMenuItem.category) {
            const menuItem = {
                name: newMenuItem.name,
                description: newMenuItem.description || '',
                price: parseFloat(newMenuItem.price),
                category: newMenuItem.category,
                image: newMenuItem.image || ''
            };

            setFormData(prev => ({
                ...prev,
                menuItems: [...prev.menuItems, menuItem]
            }));

            // Reset form
            setNewMenuItem({
                name: '',
                description: '',
                price: '',
                category: '',
                image: ''
            });
        } else {
            alert('Please fill at least Name, Price, and Category');
        }
    };

    const handleRemoveMenuItem = (index) => {
        setFormData(prev => ({
            ...prev,
            menuItems: prev.menuItems.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("ownerToken");
            console.log("Submitting restaurant data:", formData);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants/register`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json", 
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });

            // Check if response is JSON
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Non-JSON response:", text);
                throw new Error("Server returned non-JSON response");
            }

            const data = await res.json();
            
            if (res.ok && data.success) {
                alert("Restaurant registered successfully!");
                navigate('/restaurant/dashboard');
            } else {
                const errorMessage = data.errors 
                    ? data.errors.map(e => e.msg || e.message).join(", ")
                    : data.message || "Registration failed";
                alert("Error: " + errorMessage);
            }
        } catch (err) {
            console.error("Registration error:", err);
            alert("Something went wrong: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleSubmit();
    };

    const getStepStatus = (stepIndex) => {
        if (step === stepIndex + 1) return 'active';
        if (step > stepIndex + 1) return 'completed';
        return 'pending';
    };

    return (
        <div className="restaurant-register-container">
            <div className="restaurant-register-wrapper">
                <div className="restaurant-register-card">
                    <div className="restaurant-register-header">
                        <h1 className="restaurant-register-title">Register Your Restaurant</h1>
                        <p className="restaurant-register-subtitle">Partner with us and grow your business</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="progress-steps">
                        {steps.map((label, idx) => (
                            <div key={idx} className="step-item">
                                <div className="step-content">
                                    <div className={`step-indicator ${getStepStatus(idx)}`}>
                                        {step > idx + 1 ? <Check className="check-icon" /> : idx + 1}
                                    </div>
                                    <span className={`step-label ${getStepStatus(idx)}`}>{label}</span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`step-connector ${step > idx + 1 ? 'completed' : 'pending'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="form-section">
                            <div className="form-group">
                                <label className="form-label">Restaurant Name *</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={formData.basicInfo.name}
                                    onChange={e => handleNestedChange('basicInfo', 'name', e.target.value)}
                                    placeholder="Your Restaurant Name"
                                    required
                                />
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        value={formData.contact.email}
                                        onChange={e => handleNestedChange('contact', 'email', e.target.value)}
                                        placeholder="restaurant@email.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone *</label>
                                    <input
                                        className="form-input"
                                        type="tel"
                                        value={formData.contact.phone}
                                        onChange={e => handleNestedChange('contact', 'phone', e.target.value)}
                                        placeholder="+92 300 1234567"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address Line 1 *</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={formData.address.addressLine1}
                                    onChange={e => handleNestedChange('address', 'addressLine1', e.target.value)}
                                    placeholder="Street"
                                    required
                                />
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={formData.address.city}
                                        onChange={e => handleNestedChange('address', 'city', e.target.value)}
                                        placeholder="City"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cuisine Type *</label>
                                    <select
                                        className="form-select"
                                        multiple
                                        value={formData.basicInfo.cuisineType}
                                        onChange={e => {
                                            const options = Array.from(e.target.selectedOptions, option => option.value);
                                            handleNestedChange('basicInfo', 'cuisineType', options);
                                        }}
                                        required
                                    >
                                        <option value="Pakistani">Pakistani</option>
                                        <option value="Chinese">Chinese</option>
                                        <option value="Italian">Italian</option>
                                        <option value="Fast Food">Fast Food</option>
                                        <option value="Thai">Thai</option>
                                        <option value="Mexican">Mexican</option>
                                    </select>
                                    <small className="form-help">Hold Ctrl/Cmd to select multiple</small>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.basicInfo.description}
                                    onChange={e => handleNestedChange('basicInfo', 'description', e.target.value)}
                                    rows="3"
                                    placeholder="Describe your restaurant"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Business Hours</label>
                                {formData.businessHours.map((day, idx) => (
                                    <div key={idx} className="business-hour-row">
                                        <label className="business-hour-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={day.isOpen}
                                                onChange={e => handleBusinessHourChange(idx, 'isOpen', e.target.checked)}
                                            />
                                            <span>{daysOfWeek[idx]}</span>
                                        </label>
                                        <input
                                            className="form-input time-input"
                                            type="time"
                                            value={day.openingTime}
                                            disabled={!day.isOpen}
                                            onChange={e => handleBusinessHourChange(idx, 'openingTime', e.target.value)}
                                        />
                                        <input
                                            className="form-input time-input"
                                            type="time"
                                            value={day.closingTime}
                                            disabled={!day.isOpen}
                                            onChange={e => handleBusinessHourChange(idx, 'closingTime', e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Menu Setup */}
                    {step === 2 && (
                        <div className="form-section">
                            <h3 className="menu-section-header">Add Menu Items</h3>
                            
                            {/* Menu Item Form */}
                            <div className="menu-item-form">
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Item Name *</label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={newMenuItem.name}
                                            onChange={e => handleMenuItemChange('name', e.target.value)}
                                            placeholder="e.g., Chicken Biryani"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={newMenuItem.category}
                                            onChange={e => handleMenuItemChange('category', e.target.value)}
                                            placeholder="e.g., Main Course"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={newMenuItem.description}
                                        onChange={e => handleMenuItemChange('description', e.target.value)}
                                        rows="2"
                                        placeholder="Describe the menu item"
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Price (PKR) *</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            value={newMenuItem.price}
                                            onChange={e => handleMenuItemChange('price', e.target.value)}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Image URL</label>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={newMenuItem.image}
                                            onChange={e => handleMenuItemChange('image', e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                </div>

                                <button 
                                    className="add-item-button"
                                    onClick={handleAddMenuItem}
                                    disabled={!newMenuItem.name || !newMenuItem.price || !newMenuItem.category}
                                >
                                    <Plus size={16} />
                                    Add Menu Item
                                </button>
                            </div>

                            {/* Menu Items List */}
                            <div className="menu-items-list">
                                <h4 className="menu-items-title">Menu Items ({formData.menuItems.length})</h4>
                                {formData.menuItems.length === 0 ? (
                                    <p className="no-items-message">No menu items added yet</p>
                                ) : (
                                    formData.menuItems.map((item, idx) => (
                                        <div key={idx} className="menu-item-card">
                                            <div className="menu-item-content">
                                                <div className="menu-item-header">
                                                    <h5 className="menu-item-name">{item.name}</h5>
                                                    <span className="menu-item-price">{item.price} PKR</span>
                                                </div>
                                                <p className="menu-item-category">{item.category}</p>
                                                {item.description && (
                                                    <p className="menu-item-description">{item.description}</p>
                                                )}
                                            </div>
                                            <button 
                                                className="remove-item-btn"
                                                onClick={() => handleRemoveMenuItem(idx)}
                                                type="button"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Settings & Payment */}
                    {step === 3 && (
                        <div className="form-section">
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Delivery Fee (PKR)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        value={formData.settings.deliveryFee}
                                        onChange={e => handleNestedChange('settings', 'deliveryFee', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Minimum Order (PKR)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        value={formData.settings.minimumOrder}
                                        onChange={e => handleNestedChange('settings', 'minimumOrder', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Preparation Time (minutes)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        value={formData.settings.preparationTime}
                                        onChange={e => handleNestedChange('settings', 'preparationTime', parseInt(e.target.value) || 0)}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Delivery Radius (km)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        value={formData.settings.deliveryRadius}
                                        onChange={e => handleNestedChange('settings', 'deliveryRadius', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Payment Methods</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={formData.settings.paymentMethods.join(', ')}
                                    onChange={e => handleNestedChange('settings', 'paymentMethods', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                    placeholder="Cash, Credit Card, JazzCash, etc."
                                />
                                <small className="form-help">Separate multiple methods with commas</small>
                            </div>

                            <div className="summary-section">
                                <h4 className="summary-title">Registration Summary</h4>
                                <div className="summary-grid">
                                    <div className="summary-item">
                                        <span>Restaurant Name:</span>
                                        <strong>{formData.basicInfo.name || 'Not set'}</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Menu Items:</span>
                                        <strong>{formData.menuItems.length} items</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Cuisine Types:</span>
                                        <strong>{formData.basicInfo.cuisineType.join(', ') || 'Not set'}</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Delivery Fee:</span>
                                        <strong>{formData.settings.deliveryFee} PKR</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="form-navigation">
                        {step > 1 && (
                            <button 
                                className="nav-button-previous" 
                                onClick={() => setStep(step - 1)}
                                disabled={isLoading}
                            >
                                ← Previous
                            </button>
                        )}
                        <button 
                            className="nav-button-next" 
                            onClick={handleNext}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Registering...' : step === 3 ? 'Complete Registration' : `Next: ${steps[step]}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantRegisterPage;