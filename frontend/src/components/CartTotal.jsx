import { useContext, useState } from "react"
import { ShopContext } from "../context/ShopContext"
import Title from './Title'

const CartTotal = ({ showCoupon = true }) => {
    const {
        currency,
        getCartAmount,
        getDeliveryCharge,
        isFreeDeliveryAvailable,
        getAmountForFreeDelivery,
        deliverySettingsLoading,
        appliedCoupon,
        couponLoading,
        getCouponDiscount,
        applyCoupon,
        removeCoupon
    } = useContext(ShopContext);

    const [inputCode, setInputCode] = useState("");

    // Safe calculations with fallbacks
    const subtotal = getCartAmount?.() || 0;
    const couponDiscount = getCouponDiscount?.(subtotal) || 0;
    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const deliveryCharge = getDeliveryCharge?.(discountedSubtotal) || 0;
    const totalAmount = discountedSubtotal + deliveryCharge;
    const isFreeDelivery = isFreeDeliveryAvailable?.(discountedSubtotal) || false;
    const amountNeeded = getAmountForFreeDelivery?.(discountedSubtotal) || 0;

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!inputCode.trim()) return;
        const res = await applyCoupon(inputCode);
        if (res?.success) {
            setInputCode("");
        }
    };

    if (deliverySettingsLoading) {
        return (
            <div className="w-full">
                <div className="text-2xl">
                    <Title text1={'CART'} text2={'TOTAL'} />
                </div>
                <div className="mt-4 text-center">
                    <p className="text-gray-600">Loading delivery charges...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="text-2xl">
                <Title text1={'CART'} text2={'TOTAL'} />
            </div>

            {/* Promo Code Input Box */}
            {showCoupon && (
                <div className="mt-4 mb-3 p-3 bg-[#FAF8F5] border border-[#ECE8E1] rounded-lg">
                    {!appliedCoupon ? (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                            <input
                                type="text"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                placeholder="Enter promo code"
                                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-[#587a3b] uppercase tracking-wider font-medium placeholder:normal-case placeholder:font-normal"
                            />
                            <button
                                type="submit"
                                disabled={couponLoading || !inputCode.trim()}
                                className="px-4 py-2 bg-[#587a3b] text-white text-xs sm:text-sm font-medium rounded hover:bg-[#486530] disabled:opacity-50 transition-colors shrink-0"
                            >
                                {couponLoading ? "Applying..." : "Apply"}
                            </button>
                        </form>
                    ) : (
                        <div className="flex items-center justify-between bg-white px-3 py-2 border border-[#587a3b]/30 rounded">
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-[#587a3b]"></span>
                                <div>
                                    <p className="text-xs sm:text-sm font-semibold text-neutral-800 tracking-wide uppercase">
                                        {appliedCoupon.code}
                                    </p>
                                    <p className="text-[11px] text-[#587a3b]">
                                        {appliedCoupon.discountType === 'percentage'
                                            ? `${appliedCoupon.discountValue}% OFF discount applied`
                                            : `${currency} ${appliedCoupon.discountValue} OFF discount applied`}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeCoupon}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-2 flex flex-col gap-2 text-sm">
                {/* Subtotal */}
                <div className="flex justify-between">
                    <p>Subtotal</p>
                    <p>{currency} {subtotal.toFixed(2)}</p>
                </div>
                <hr />

                {/* Promo Code Discount */}
                {couponDiscount > 0 && (
                    <>
                        <div className="flex justify-between items-center text-[#587a3b]">
                            <p className="font-medium flex items-center gap-1">
                                Discount ({appliedCoupon?.code})
                            </p>
                            <p className="font-semibold">- {currency} {couponDiscount.toFixed(2)}</p>
                        </div>
                        <hr />
                    </>
                )}

                {/* Shipping Fee */}
                <div className="flex justify-between">
                    <div>
                        <p>Shipping Fee</p>
                        {!isFreeDelivery && amountNeeded > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                                Add {currency} {amountNeeded.toFixed(2)} more for FREE delivery!
                            </p>
                        )}
                    </div>
                    <div>
                        {isFreeDelivery ? (
                            <p className="text-green-600">FREE</p>
                        ) : (
                            <p>{currency} {deliveryCharge.toFixed(2)}</p>
                        )}
                    </div>
                </div>
                <hr />

                {/* Total */}
                <div className="flex justify-between font-bold text-base text-gray-900">
                    <p>Total</p>
                    <p>{currency} {totalAmount.toFixed(2)}</p>
                </div>
            </div>
        </div>
    )
}

export default CartTotal