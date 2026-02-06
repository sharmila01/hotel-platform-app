'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { hotelApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Hotel {
    id: number;
    name: string;
    location: string;
    status: string;
}

const HotelsPage = () => {
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newHotel, setNewHotel] = useState({ name: '', location: '' });
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchHotels();
        }
    }, [isAuthenticated]);

    const fetchHotels = async () => {
        try {
            const response = await hotelApi.getHotels();
            setHotels(response.data);
        } catch (err) {
            console.error('Failed to fetch hotels', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHotel = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await hotelApi.createHotel(newHotel);
            setNewHotel({ name: '', location: '' });
            setShowAddModal(false);
            fetchHotels();
        } catch (err) {
            alert('Failed to add hotel');
        }
    };

    const handleDeleteHotel = async (id: number) => {
        if (confirm('Are you sure you want to delete this hotel?')) {
            try {
                await hotelApi.deleteHotel(id);
                fetchHotels();
            } catch (err) {
                alert('Failed to delete hotel');
            }
        }
    };

    if (loading) return <div className="main-content"><p>Loading hotels...</p></div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Manage Hotels</h1>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    + Add Hotel
                </button>
            </div>

            {showAddModal && (
                <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Add New Hotel</h3>
                    <form onSubmit={handleAddHotel} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                            <label>Hotel Name</label>
                            <input
                                className="input"
                                value={newHotel.name}
                                onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                            <label>Location</label>
                            <input
                                className="input"
                                value={newHotel.location}
                                onChange={(e) => setNewHotel({ ...newHotel, location: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: '1rem' }}>
                            <button type="submit" className="btn btn-primary">Save</button>
                            <button type="button" onClick={() => setShowAddModal(false)} className="btn" style={{ border: '1px solid var(--border)' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="hotel-grid">
                {hotels.map((hotel) => (
                    <div key={hotel.id} className="card hotel-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3>{hotel.name}</h3>
                            <span className={`badge badge-${hotel.status}`}>{hotel.status}</span>
                        </div>
                        <p className="hotel-location">{hotel.location}</p>
                        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                            <Link href={`/hotels/${hotel.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                                View Details
                            </Link>
                            <button onClick={() => handleDeleteHotel(hotel.id)} className="btn btn-sm" style={{ border: '1px solid #fee2e2', color: '#ef4444' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {hotels.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <p>No hotels found. Add your first hotel to get started!</p>
                </div>
            )}
        </div>
    );
};

export default HotelsPage;
