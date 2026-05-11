import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { resolveServerUrl } from '../lib/api';

const BrandContext = createContext();

export const BrandProvider = ({ children }) => {
    const [brand, setBrand] = useState({
        name: '',
        address: '',
        logo: null,
        contact: '',
        whatsapp: '',
        loading: true
    });

    const fetchBrand = async () => {
        try {
            // Using the bulk endpoint to get all branding settings in ONE request
            const keys = 'company_name,company_address,company_logo,company_contact_number,company_whatsapp_number';
            const { data } = await api.get(`/settings/bulk/fetch?keys=${keys}`);
            
            setBrand({
                name: data.company_name !== 'false' ? (data.company_name || '') : '',
                address: data.company_address !== 'false' ? (data.company_address || '') : '',
                logo: data.company_logo !== 'false' && data.company_logo ? resolveServerUrl(data.company_logo) : null,
                contact: data.company_contact_number !== 'false' ? (data.company_contact_number || '') : '',
                whatsapp: data.company_whatsapp_number !== 'false' ? (data.company_whatsapp_number || '') : '',
                loading: false
            });
        } catch (error) {
            console.error('Failed to load branding:', error);
            setBrand(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchBrand();
    }, []);

    return (
        <BrandContext.Provider value={{ ...brand, refresh: fetchBrand }}>
            {children}
        </BrandContext.Provider>
    );
};

export const useBrand = () => useContext(BrandContext);
