import React from 'react';
import { UserProfile } from '../types';

interface UserCardProps {
  user: UserProfile;
  onViewProfile?: (handle: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onViewProfile }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 flex flex-col items-center border border-gray-100 relative">
      
      {/* Avatar Container with Hover Effect */}
      <div className="relative group mb-4">
        <div className="w-20 h-20 rounded-full bg-[#F5F5F5] overflow-hidden border-2 border-white shadow-sm flex items-center justify-center cursor-pointer">
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        </div>
        
        {/* Large Preview Popover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 h-48 bg-white p-1.5 rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none scale-75 group-hover:scale-100 origin-bottom">
             <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl bg-gray-50" />
             {/* Small arrow/tail */}
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100"></div>
        </div>
      </div>
      
      <h3 className="font-serif text-xl text-terreta-dark font-medium mb-1 text-center">
        {user.name}
      </h3>
      
      <p className="text-[#D97706] text-xs font-bold tracking-wider uppercase mb-1 text-center font-sans">
        {user.role}
      </p>
      
      <p className="text-gray-400 text-sm mb-6 text-center font-sans">
        {user.handle}
      </p>
      
      <button 
        onClick={() => onViewProfile && onViewProfile(user.handle)}
        className="w-full bg-[#F9F6F0] hover:bg-[#EEE9DD] text-terreta-dark font-sans font-medium py-3 rounded-lg transition-colors text-sm border border-[#EAE5D9]"
      >
        Ver Perfil
      </button>
    </div>
  );
};