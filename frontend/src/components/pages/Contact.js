import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Contact form submitted!');
    console.log('Form data:', formData);
    
    setFormData({
      name: '',
      email: '',
      message: ''
    });
  };

  return (
    <div className="container">
      <h1>Contact Us</h1>
      <p className="subtitle">Get in touch with our team</p>
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={6}
              placeholder="Your message..."
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-full">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;