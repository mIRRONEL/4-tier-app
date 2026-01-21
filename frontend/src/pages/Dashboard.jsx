import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ title: '', description: '' });
    const [search, setSearch] = useState('');
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        fetchItems();
    }, [search]);

    const fetchItems = async () => {
        try {
            const endpoint = search ? `/items/search?q=${search}` : '/items';
            const response = await axios.get(`${API_URL}${endpoint}`);
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const addItem = async (e) => {
        e.preventDefault();
        if (!newItem.title) return;
        try {
            await axios.post(`${API_URL}/items`, newItem);
            setNewItem({ title: '', description: '' });
            fetchItems();
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow p-4 flex justify-between items-center">
                <span className="font-bold text-xl text-blue-600">Mina App</span>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.username}</span>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto p-8">
                {/* Helper to add items */}
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                    <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
                    <form onSubmit={addItem} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Title"
                            value={newItem.title}
                            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                        <textarea
                            placeholder="Description (Optional)"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Add Item
                        </button>
                    </form>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search your items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-3 border rounded-lg shadow-sm"
                    />
                </div>

                {/* List */}
                <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                            <h4 className="font-bold text-lg">{item.title}</h4>
                            <p className="text-gray-600 mt-2">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
