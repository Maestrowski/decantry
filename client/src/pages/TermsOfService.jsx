import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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
            <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Terms of Service</h1>
            <p style={{ color: 'var(--color-gray)', marginBottom: '30px' }}>Last updated: {new Date().toLocaleDateString()}</p>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>1. Agreement to Terms</h2>
                <p style={{ lineHeight: '1.6' }}>
                    By accessing or using Decantry, you agree to be bound by these Terms of Service and our Privacy Policy.
                    If you do not agree to these terms, please do not use our services.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>2. User Accounts</h2>
                <p style={{ lineHeight: '1.6' }}>
                    When you create an account with us, you must provide us information that is accurate, complete, and current at all times.
                    Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                </p>
                <p style={{ lineHeight: '1.6', marginTop: '10px' }}>
                    You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>3. Intellectual Property</h2>
                <p style={{ lineHeight: '1.6' }}>
                    The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Decantry and its licensors.
                    The Service is protected by copyright, trademark, and other laws of both the Country and foreign countries.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>4. Termination</h2>
                <p style={{ lineHeight: '1.6' }}>
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    Upon termination, your right to use the Service will immediately cease.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>5. Limitation of Liability</h2>
                <p style={{ lineHeight: '1.6' }}>
                    In no event shall Decantry, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>6. Changes</h2>
                <p style={{ lineHeight: '1.6' }}>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>7. Contact Us</h2>
                <p style={{ lineHeight: '1.6' }}>
                    If you have any questions about these Terms, please contact us at: support@decantry.com.
                </p>
            </section>
        </div>
    );
};

export default TermsOfService;
