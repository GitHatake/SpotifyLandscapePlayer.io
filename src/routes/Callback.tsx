import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../services/auth';

export default function Callback() {
    const navigate = useNavigate();
    const called = useRef(false);

    useEffect(() => {
        if (called.current) return;
        called.current = true;

        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
            getAccessToken(code).then((token) => {
                if (token) {
                    navigate('/player');
                } else {
                    navigate('/');
                }
            }).catch(e => {
                console.error("Auth Error", e);
                navigate('/');
            });
        } else {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="flex h-screen items-center justify-center bg-black text-white">
            <div className="animate-pulse">Authenticating...</div>
        </div>
    );
}
