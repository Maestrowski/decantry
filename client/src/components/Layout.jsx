import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children, user }) => {
    return (
        <>
            <Navbar user={user} />
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                width: '100%'
            }}>
                {children}
            </main>
        </>
    );
};

export default Layout;
