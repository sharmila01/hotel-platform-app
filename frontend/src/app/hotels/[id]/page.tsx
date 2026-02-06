'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { hotelApi, roomTypeApi, adjustmentApi } from '@/lib/api';

interface RateAdjustment {
    id: number;
    adjustment_amount: number;
    effective_date: string;
    reason: string;
    created_at: string;
}

interface RoomType {
    id: number;
    name: string;
    base_rate: number;
    effective_rate: number;
    adjustments: RateAdjustment[];
}

interface Hotel {
    id: number;
    name: string;
    location: string;
    status: string;
    room_types: RoomType[];
}

const HotelDetailPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form states
    const [showAdjustmentForm, setShowAdjustmentForm] = useState<number | null>(null);
    const [adjustmentData, setAdjustmentData] = useState({
        adjustment_amount: '',
        effective_date: new Date().toISOString().split('T')[0],
        reason: ''
    });
    
    const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
    const [roomTypeData, setRoomTypeData] = useState({
        name: '',
        base_rate: ''
    });

    const [selectedHistory, setSelectedHistory] = useState<number | null>(null);
    const [historyData, setHistoryData] = useState<RateAdjustment[]>([]);

    useEffect(() => {
        if (id) {
            fetchHotelDetails();
        }
    }, [id]);

    const fetchHotelDetails = async () => {
        try {
            const response = await hotelApi.getHotel(Number(id));
            setHotel(response.data);
        } catch (err: any) {
            setError('Failed to load hotel details.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoomType = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await roomTypeApi.createRoomType({
                ...roomTypeData,
                base_rate: parseFloat(roomTypeData.base_rate),
                hotel_id: Number(id)
            });
            setRoomTypeData({ name: '', base_rate: '' });
            setShowRoomTypeForm(false);
            fetchHotelDetails();
        } catch (err) {
            alert('Failed to add room type');
        }
    };

    const handleAddAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adjustmentApi.createAdjustment({
                ...adjustmentData,
                adjustment_amount: parseFloat(adjustmentData.adjustment_amount),
                room_type_id: showAdjustmentForm
            });
            setShowAdjustmentForm(null);
            setAdjustmentData({
                adjustment_amount: '',
                effective_date: new Date().toISOString().split('T')[0],
                reason: ''
            });
            fetchHotelDetails();
        } catch (err) {
            alert('Failed to add adjustment');
        }
    };

    const viewHistory = async (roomTypeId: number) => {
        setSelectedHistory(roomTypeId);
        try {
            const response = await roomTypeApi.getAdjustmentHistory(roomTypeId);
            setHistoryData(response.data);
        } catch (err) {
            alert('Failed to load history');
        }
    };

    if (loading) return <div className="main-content">Loading...</div>;
    if (error || !hotel) return <div className="main-content"><p>{error || 'Hotel not found'}</p></div>;

    return (
        <div className="animate-fade-in">
            <button onClick={() => router.back()} className="btn" style={{ marginBottom: '1rem', paddingLeft: 0 }}>
                ← Back to Hotels
            </button>
            
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>{hotel.name}</h1>
                    <p className="hotel-location">{hotel.location}</p>
                </div>
                <span className={`badge badge-${hotel.status}`}>{hotel.status}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem' }}>
                <h2>Room Types & Pricing</h2>
                <button onClick={() => setShowRoomTypeForm(true)} className="btn btn-primary btn-sm">
                    + Add Room Type
                </button>
            </div>

            {showRoomTypeForm && (
                <div className="card animate-fade-in" style={{ border: '1px dashed var(--primary)' }}>
                    <h3>New Room Type</h3>
                    <form onSubmit={handleAddRoomType} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Name</label>
                            <input
                                className="input"
                                value={roomTypeData.name}
                                onChange={(e) => setRoomTypeData({...roomTypeData, name: e.target.value})}
                                placeholder="e.g. Deluxe Suite"
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Base Rate ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={roomTypeData.base_rate}
                                onChange={(e) => setRoomTypeData({...roomTypeData, base_rate: e.target.value})}
                                placeholder="100.00"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: '1rem' }}>
                            <button type="submit" className="btn btn-primary">Save</button>
                            <button type="button" onClick={() => setShowRoomTypeForm(false)} className="btn">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container card" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Room Type</th>
                            <th>Base Rate</th>
                            <th>Effective Rate</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hotel.room_types.map((rt) => (
                            <React.Fragment key={rt.id}>
                                <tr>
                                    <td style={{ fontWeight: '600' }}>{rt.name}</td>
                                    <td>${rt.base_rate.toFixed(2)}</td>
                                    <td style={{ color: 'var(--primary)', fontWeight: '700' }}>
                                        ${rt.effective_rate.toFixed(2)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button 
                                                onClick={() => setShowAdjustmentForm(rt.id)} 
                                                className="btn btn-primary btn-sm"
                                            >
                                                Adjust Rate
                                            </button>
                                            <button 
                                                onClick={() => viewHistory(rt.id)} 
                                                className="btn btn-sm" 
                                                style={{ border: '1px solid var(--border)' }}
                                            >
                                                History
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {showAdjustmentForm === rt.id && (
                                    <tr>
                                        <td colSpan={4} style={{ backgroundColor: '#f8fafc', padding: '1.5rem' }}>
                                            <div className="animate-fade-in">
                                                <h4 style={{ marginBottom: '1rem' }}>New Rate Adjustment for {rt.name}</h4>
                                                <form onSubmit={handleAddAdjustment} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                                                    <div className="form-group">
                                                        <label>Amount (+/- $)</label>
                                                        <input 
                                                            type="number" 
                                                            className="input" 
                                                            value={adjustmentData.adjustment_amount}
                                                            onChange={(e) => setAdjustmentData({...adjustmentData, adjustment_amount: e.target.value})}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Effective Date</label>
                                                        <input 
                                                            type="date" 
                                                            className="input" 
                                                            value={adjustmentData.effective_date}
                                                            onChange={(e) => setAdjustmentData({...adjustmentData, effective_date: e.target.value})}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Reason</label>
                                                        <input 
                                                            className="input" 
                                                            value={adjustmentData.reason}
                                                            onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                                                            placeholder="e.g. Seasonal Holiday Peak"
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '1rem' }}>
                                                        <button type="submit" className="btn btn-primary btn-sm">Apply</button>
                                                        <button type="button" onClick={() => setShowAdjustmentForm(null)} className="btn btn-sm">Cancel</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {selectedHistory === rt.id && (
                                    <tr>
                                        <td colSpan={4} style={{ backgroundColor: '#fff', border: '2px solid #f1f5f9', padding: '1.5rem' }}>
                                            <div className="animate-fade-in">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                    <h4>Adjustment History: {rt.name}</h4>
                                                    <button onClick={() => setSelectedHistory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕ Close</button>
                                                </div>
                                                {historyData.length === 0 ? <p>No adjustments found.</p> : (
                                                    <table style={{ fontSize: '0.75rem' }}>
                                                        <thead>
                                                            <tr>
                                                                <th>Date Applied</th>
                                                                <th>Amount</th>
                                                                <th>Effective Date</th>
                                                                <th>Reason</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {historyData.map((h) => (
                                                                <tr key={h.id}>
                                                                    <td>{new Date(h.created_at).toLocaleDateString()}</td>
                                                                    <td style={{ color: h.adjustment_amount >= 0 ? 'green' : 'red' }}>
                                                                        {h.adjustment_amount >= 0 ? '+' : ''}{h.adjustment_amount}$
                                                                    </td>
                                                                    <td>{h.effective_date}</td>
                                                                    <td>{h.reason}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {hotel.room_types.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No room types added yet.</p>
                )}
            </div>
        </div>
    );
};

export default HotelDetailPage;
