import { useContext } from "react"
import { ShopContext } from "../context/ShopContext"
import Title from './Title'

const CartTotal = () => {
    const { 
        currency, 
        getCartAmount, 
        getDeliveryCharge,
        isFreeDeliveryAvailable,
        getAmountForFreeDelivery 
    } = useContext(ShopContext)

    // Safe calculations with fallbacks
    const subtotal = getCartAmount?.() || 0
    const deliveryCharge = getDeliveryCharge?.(subtotal) || 0
    const totalAmount = subtotal + deliveryCharge
    const isFreeDelivery = isFreeDeliveryAvailable?.(subtotal) || false
    const amountNeeded = getAmountForFreeDelivery?.(subtotal) || 0

    return (
        <div className="w-full">
            <div className="text-2xl">
                <Title text1={'CART'} text2={'TOTAL'}/>
            </div>
            <div className="mt-2 flex flex-col gap-2 text-sm">
                {/* Subtotal */}
                <div className="flex justify-between">
                    <p>Subtotal</p>
                    <p>{currency} {subtotal.toFixed(2)}</p>
                </div>
                <hr />
                
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
                <div className="flex justify-between">
                    <p>Total</p>
                    <p>{currency} {totalAmount.toFixed(2)}</p>
                </div>
            </div>
        </div>
    )
}

export default CartTotal