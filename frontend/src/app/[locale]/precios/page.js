"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useState } from 'react';

export default function PricingPage() {
    const router = useRouter();
    const { user, token, apiBase } = useAuth();
    const [{ isPending }] = usePayPalScriptReducer();
    const [status, setStatus] = useState({ state: 'idle', message: '' });

    const createOrder = (data, actions) => {
        return actions.order.create({
            purchase_units: [{
                description: "Acceso Pro a LucidSpeak",
                amount: { currency_code: "USD", value: "7.00" },
            }],
        });
    };

    const onApprove = async (data, actions) => {
        setStatus({ state: 'processing', message: 'Procesando tu pago...' });

        try {
            const details = await actions.order.capture();
            if (!token) throw new Error("Error de autenticación. Por favor, inicia sesión de nuevo.");

            const response = await fetch(`${apiBase}/confirm-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({ orderID: data.orderID })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "El backend no pudo actualizar la cuenta.");
            }

            setStatus({ state: 'success', message: '¡Pago exitoso! Redirigiendo a tu cuenta...' });
            setTimeout(() => { router.push('/cuenta'); }, 2000);

        } catch (error) {
            console.error("Error en el flujo de aprobación:", error);
            setStatus({ state: 'error', message: error.message || 'Hubo un problema al verificar tu pago.' });
        }
    };

    const onError = (err) => {
        console.error("Error en el pago de PayPal:", err);
        setStatus({ state: 'error', message: 'Ocurrió un error con el pago o fue cancelado.' });
    };

    return (
        <div className="flex-grow flex flex-col items-center justify-center w-full text-center p-6">
            <h1 className="text-4xl font-bold text-sky-400 mb-6">Desbloquea tu Potencial</h1>
            <div className="w-full max-w-md bg-slate-800 p-10 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold">Plan Pro</h2>
                <p className="text-5xl font-bold my-4">$7 <span className="text-lg text-slate-400">USD</span></p>
                <p className="text-slate-400 mb-8">Un único pago para acceso de por vida.</p>

                <div className="min-h-[150px]">
                    {isPending && <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mx-auto animate-spin border-t-sky-500"></div>}

                    <div style={{ display: status.state === 'idle' ? 'block' : 'none' }}>
                        {!isPending && (
                            <>
                                <PayPalButtons
                                    style={{ layout: "vertical" }}
                                    createOrder={createOrder}
                                    onApprove={onApprove}
                                    onError={onError}
                                    disabled={!user}
                                />
                                {!user && <p className="text-yellow-400 text-sm mt-4">Debes iniciar sesión para poder comprar.</p>}
                            </>
                        )}
                    </div>

                    {status.state === 'processing' && <p className="text-slate-400 pt-8">{status.message}</p>}
                    {status.state === 'success' && <p className="text-green-400 font-bold pt-8">{status.message}</p>}
                    {status.state === 'error' && (
                        <div className="pt-8">
                            <p className="text-red-400 font-bold">{status.message}</p>
                            <button onClick={() => setStatus({ state: 'idle', message: '' })} className="mt-4 bg-sky-500 text-white px-4 py-2 rounded">Intentar de nuevo</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}