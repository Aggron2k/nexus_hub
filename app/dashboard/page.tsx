import React from 'react';
import EmptyState from '@/app/components/EmptyState';
import Sidebar from '@/app/components/sidebar/Sidebar';
import Image from 'next/image';

const DashboardPage = () => {
    return (
        <Sidebar>
            <div className="hidden lg:block lg:pl-80 h-full">
                <Image alt="logo" height="100" width="200" className='mx-auto w-auto' src="/images/logo_big.png" />
            </div>
        </Sidebar>
    );
};

export default DashboardPage;
