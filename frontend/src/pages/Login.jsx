import axios from "axios"
import { useState, useContext, useEffect } from "react"
import { ShopContext } from "../context/ShopContext"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"

const Login = () => {
  const [mode, setMode] = useState('login') // 'login', 'signup', 'forgot-password', 'reset-password'
  const { token, setToken, backendUrl } = useContext(ShopContext)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    newPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [canResendOtp, setCanResendOtp] = useState(true)
  const [resendTimer, setResendTimer] = useState(0)
  const navigate = useNavigate()

  const isSignUp = mode === 'signup'
  const isForgotPassword = mode === 'forgot-password'
  const isResetPassword = mode === 'reset-password'
  const isLogin = mode === 'login'

  // Email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Resend OTP function
  const handleResendOtp = async () => {
    if (!canResendOtp) return

    try {
      setIsLoading(true)
      const response = await axios.post(`${backendUrl}/api/user/resend-otp`, {
        email: formData.email
      })
      
      if (response.data.success) {
        toast.success("New OTP sent to your email")
        setCanResendOtp(false)
        setResendTimer(60) // 60 seconds cooldown
        
        // Start countdown timer
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              setCanResendOtp(true)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    // Email validation
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Validate confirm password for signup
    if (isSignUp && formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    // Validate password length for signup
    if (isSignUp && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    // Validate new password for reset password
    if (isResetPassword && formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    // Validate OTP for reset password
    if (isResetPassword && formData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)

    try {
      if (isSignUp) {
        const response = await axios.post(`${backendUrl}/api/user/register`, {
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
        
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
          toast.success("Account created successfully")
          navigate("/")
        } else {
          toast.error(response.data.message)
        }
      } else if (isLogin) {
        const response = await axios.post(`${backendUrl}/api/user/login`, {
          email: formData.email,
          password: formData.password
        })
        
        if (response.data.success) {
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
          toast.success("Logged in successfully")
          navigate("/")
        } else {
          toast.error(response.data.message)
        }
      } else if (isForgotPassword) {
        // Send OTP for password reset
        const response = await axios.post(`${backendUrl}/api/user/forgot-password`, {
          email: formData.email
        })
        
        if (response.data.success) {
          toast.success("OTP sent to your email")
          setMode('reset-password')
          setCanResendOtp(false)
          setResendTimer(60) // Start 60 second cooldown
          
          // Start countdown timer
          const timer = setInterval(() => {
            setResendTimer(prev => {
              if (prev <= 1) {
                clearInterval(timer)
                setCanResendOtp(true)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        } else {
          toast.error(response.data.message)
        }
      } else if (isResetPassword) {
        // Verify OTP and reset password
        const response = await axios.post(`${backendUrl}/api/user/reset-password`, {
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        })
        
        if (response.data.success) {
          toast.success("Password reset successfully")
          setMode('login')
          setFormData(prev => ({ ...prev, email: '', otp: '', newPassword: '' }))
          setCanResendOtp(true)
          setResendTimer(0)
        } else {
          toast.error(response.data.message)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(current => current === 'login' ? 'signup' : 'login')
    setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '', newPassword: '' })
    setCanResendOtp(true)
    setResendTimer(0)
  }

  const handleForgotPassword = () => {
    setMode('forgot-password')
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
  }

  const handleBackToLogin = () => {
    setMode('login')
    setFormData(prev => ({ ...prev, otp: '', newPassword: '' }))
    setCanResendOtp(true)
    setResendTimer(0)
  }

  const getDisplayText = () => {
    switch (mode) {
      case 'signup': return 'Sign Up'
      case 'forgot-password': return 'Forgot Password'
      case 'reset-password': return 'Reset Password'
      default: return 'Login'
    }
  }

  const getSubmitButtonText = () => {
    if (isLoading) return 'Loading...'
    switch (mode) {
      case 'signup': return 'Sign Up'
      case 'forgot-password': return 'Send OTP'
      case 'reset-password': return 'Reset Password'
      default: return 'Sign In'
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token, navigate])

  return (
    <form onSubmit={handleSubmit} className="m-auto mt-14 flex w-[90%] max-w-96 flex-col items-center gap-4 text-gray-800">
      <div className="mb-2 mt-10 flex items-center gap-2">
        <h1 className="prata-regular text-3xl">{getDisplayText()}</h1>
        <hr className="h-[1.5px] w-8 border-none bg-gray-800" />
      </div>

      {/* Name field for signup */}
      {isSignUp && (
        <input
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          type="text"
          className="w-full border border-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          placeholder="Name"
          required
          disabled={isLoading}
        />
      )}

      {/* Email field for all modes */}
      <input
        value={formData.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        type="email"
        className="w-full border border-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
        placeholder="Email"
        required
        disabled={isLoading || isResetPassword}
      />

      {/* Password fields for login and signup */}
      {(isLogin || isSignUp) && (
        <div className="relative w-full">
          <input
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            type={showPassword ? "text" : "password"}
            className="w-full border border-gray-800 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            placeholder="Password"
            required
            disabled={isLoading}
            minLength={8}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      )}

      {/* Confirm password for signup */}
      {isSignUp && (
        <div className="relative w-full">
          <input
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            type={showConfirmPassword ? "text" : "password"}
            className="w-full border border-gray-800 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            placeholder="Confirm Password"
            required
            disabled={isLoading}
            minLength={8}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      )}

      {/* OTP field for reset password */}
      {isResetPassword && (
        <div className="w-full">
          <input
            value={formData.otp}
            onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
            type="text"
            className="w-full border border-gray-800 px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            placeholder="Enter 6-digit OTP"
            required
            disabled={isLoading}
            maxLength={6}
            pattern="\d{6}"
          />
          <div className="mt-2 text-center">
            <button 
              type="button" 
              onClick={handleResendOtp}
              className={`text-sm ${canResendOtp ? 'text-gray-600 hover:text-gray-800' : 'text-gray-400'} disabled:opacity-50`}
              disabled={!canResendOtp || isLoading}
            >
              {canResendOtp ? "Didn't receive OTP? Resend" : `Resend OTP in ${resendTimer}s`}
            </button>
          </div>
        </div>
      )}

      {/* New password field for reset password */}
      {isResetPassword && (
        <div className="relative w-full">
          <input
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            type={showNewPassword ? "text" : "password"}
            className="w-full border border-gray-800 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            placeholder="New Password"
            required
            disabled={isLoading}
            minLength={8}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            onClick={() => setShowNewPassword(!showNewPassword)}
            disabled={isLoading}
          >
            {showNewPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-[-8px] flex w-full justify-between text-sm">
        {/* Forgot password / Back to login */}
        {isLogin ? (
          <button 
            type="button" 
            onClick={handleForgotPassword}
            className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
            disabled={isLoading}
          >
            Forgot your password?
          </button>
        ) : (isForgotPassword || isResetPassword) && (
          <button 
            type="button" 
            onClick={handleBackToLogin}
            className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
            disabled={isLoading}
          >
            Back to Login
          </button>
        )}
        
        {/* Toggle between login and signup */}
        {(isLogin || isSignUp) && (
          <button 
            type="button" 
            onClick={toggleMode}
            className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
            disabled={isLoading}
          >
            {isSignUp ? 'Login Here' : 'Create account'}
          </button>
        )}
      </div>

      {/* Submit button */}
      <button 
        type="submit" 
        className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {getSubmitButtonText()}
      </button>
    </form>
  )
}

export default Login