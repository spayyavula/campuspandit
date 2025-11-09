import React from 'react';

interface ComingSoonProps {
  featureName?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ featureName = 'This feature' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Coming Soon</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px' }}>
        {featureName} is currently being upgraded and will be available soon.
      </p>
      <p style={{ fontSize: '1rem', color: '#888', marginTop: '1rem' }}>
        We're working hard to bring you an improved experience!
      </p>
    </div>
  );
};

export default ComingSoon;
