import PropTypes from 'prop-types';
import React, { useState } from 'react';

function RawDataInput({ value, onChange, onSubmit }) {
  const [importMode, setImportMode] = useState('WITS'); // Default to WITS (New)

  const handleImport = () => {
    onSubmit(importMode);
  };

  return (
    <div className="raw-data-input">
      <div className="import-mode-toggle">
        <button 
          className={`mode-button ${importMode === 'WITS' ? 'active' : ''}`}
          onClick={() => setImportMode('WITS')}
        >
          WITS (New)
        </button>
        <button 
          className={`mode-button ${importMode === 'AIMS' ? 'active' : ''}`}
          onClick={() => setImportMode('AIMS')}
        >
          AIMS (Legacy)
        </button>
      </div>
      
      <p className="input-description">
        {importMode === 'WITS' 
          ? "Paste HTML table data or compact schedule text from WITS." 
          : "Paste tab-separated schedule data from AIMS (Legacy)."}
      </p>
      
      <textarea
        value={value}
        onChange={onChange}
        placeholder={importMode === 'WITS' 
          ? "Copy-paste the WITS table here (HTML or compact text format)" 
          : "Go to AIMS -> Section Offering and copy-paste the table data here"}
      />
      <button onClick={handleImport} className="submit-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" x2="12" y1="3" y2="15"></line>
        </svg>
        Import {importMode} Data
      </button>
    </div>
  );
}


RawDataInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default RawDataInput;