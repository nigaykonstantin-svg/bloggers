import { useMemo } from 'react';
import { Menu, ShoppingBag, Bell } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCollaborations } from '../../data/collaborations';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
    const { items } = useCart();
    const { user } = useAuth();
    const { getCollaborationsByBloggerId, collaborations } = useCollaborations();
    const navigate = useNavigate();

    const notifications = useMemo(() => {
        if (!user) return [];
        const userCollabs = getCollaborationsByBloggerId(user.id) || [];

        // Find urgent deadlines (within 3 days)
        const urgent = userCollabs.filter(c => {
            if (c.status !== 'waiting_content' || !c.deadline) return false;
            const daysLeft = Math.ceil((new Date(c.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            return daysLeft <= 3;
        });

        // Find unshipped pending (stuck for > 3 days) - illustration
        // Find completed recently (for rating notification) - illustration

        return urgent.length;
    }, [user, collaborations]);

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
                {/* Mobile menu button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Page title - can be dynamic */}
                <div className="hidden lg:block">
                    <h1 className="text-lg font-semibold text-dark">
                        Добро пожаловать, {user?.firstName}!
                    </h1>
                </div>

                {/* Mobile logo */}
                <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-mixit rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">M</span>
                    </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-lg relative"
                    >
                        <Bell className={`w-5 h-5 ${notifications > 0 ? 'text-mixit-pink' : 'text-gray-600'}`} />
                        {notifications > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-mixit-pink rounded-full animate-pulse"></span>
                        )}
                    </button>

                    <Link
                        to="/products"
                        className="p-2 hover:bg-gray-100 rounded-lg relative"
                    >
                        <ShoppingBag className="w-5 h-5 text-gray-600" />
                        {items.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-mixit-pink text-white text-xs rounded-full flex items-center justify-center font-medium">
                                {items.length}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}
