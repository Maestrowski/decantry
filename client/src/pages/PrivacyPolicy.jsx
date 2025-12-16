import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: 'var(--color-text)' }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '20px'
                }}
            >
                <ArrowLeft size={24} />
                Back
            </button>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Privacy Policy</h1>
            <p style={{ color: 'var(--color-gray)', marginBottom: '30px' }}>Last updated: {new Date().toLocaleDateString()}</p>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>1. Introduction</h2>
                <p style={{ lineHeight: '1.6' }}>
                    Welcome to Decantry. We respect your privacy and are committed to protecting your personal data.
                    This privacy policy will inform you as to how we look after your personal data when you visit our website
                    and tell you about your privacy rights and how the law protects you.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>2. Data We Collect</h2>
                <p style={{ lineHeight: '1.6' }}>
                    We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '10px', lineHeight: '1.6' }}>
                    <li><strong>Identity Data:</strong> includes username or similar identifier.</li>
                    <li><strong>Contact Data:</strong> includes email address.</li>
                    <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
                    <li><strong>Usage Data:</strong> includes information about how you use our website, products and services (e.g., game scores, game history).</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>3. How We Use Your Data</h2>
                <p style={{ lineHeight: '1.6' }}>
                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '10px', lineHeight: '1.6' }}>
                    <li>To register you as a new customer.</li>
                    <li>To manage our relationship with you.</li>
                    <li>To enable you to participate in interactive features of our service, such as multiplayer games.</li>
                    <li>To improve our website, products/services, marketing and customer relationships.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>4. Data Security</h2>
                <p style={{ lineHeight: '1.6' }}>
                    We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>5. Contact Us</h2>
                <p style={{ lineHeight: '1.6' }}>
                    If you have any questions about this privacy policy or our privacy practices, please contact us at: support@decantry.com.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
