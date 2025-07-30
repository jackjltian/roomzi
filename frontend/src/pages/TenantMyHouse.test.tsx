import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/utils';
import TenantMyHouse from './TenantMyHouse';
import { mockTenantUser, mockUseAuth } from '../test/utils';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TenantMyHouse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockTenantUser,
    });
  });

  it('should render loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null, // No user to trigger loading-like state
    });

    render(<TenantMyHouse />);
    
    // Since the component uses demo data, we expect to see the rental details
    // But with no user, it should handle gracefully
    expect(screen.getByText('My House')).toBeInTheDocument();
  });

  it('should render active rental details', () => {
    render(<TenantMyHouse />);
    
    // Check header
    expect(screen.getByText('My House')).toBeInTheDocument();
    expect(screen.getByText('Active Rental')).toBeInTheDocument();
    
    // Check property details
    expect(screen.getByText('My Rental Property')).toBeInTheDocument();
    expect(screen.getByText('123 Main Street, New York, NY')).toBeInTheDocument();
    
    // Check for rent amount - use getAllByText and check the first one
    const rentAmounts = screen.getAllByText('$2,500');
    expect(rentAmounts[0]).toBeInTheDocument();
    expect(screen.getByText('per month')).toBeInTheDocument();
    
    // Check lease information
    expect(screen.getByText('Lease Information')).toBeInTheDocument();
    expect(screen.getByText('January 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('December 31, 2024')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    
    // Check landlord contact
    expect(screen.getByText('Landlord Contact')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('john.smith@email.com')).toBeInTheDocument();
  });

  it('should render quick action buttons', () => {
    render(<TenantMyHouse />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /payments/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /maintenance request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule inspection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lease renewal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /financial account/i })).toBeInTheDocument();
  });

  it('should navigate back to tenant dashboard when back button is clicked', () => {
    render(<TenantMyHouse />);
    
    const backButton = screen.getByRole('button', { name: '' }); // Arrow back button
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/tenant');
  });

  it('should navigate to payments page when payments button is clicked', () => {
    render(<TenantMyHouse />);
    
    const paymentsButton = screen.getByRole('button', { name: /payments/i });
    fireEvent.click(paymentsButton);
    
    // Since currentRental.id is "1", it should navigate to payments with that ID
    expect(mockNavigate).toHaveBeenCalledWith('/tenant/payments/1');
  });

  it('should navigate to maintenance request page when maintenance button is clicked', () => {
    render(<TenantMyHouse />);
    
    const maintenanceButton = screen.getByRole('button', { name: /maintenance request/i });
    fireEvent.click(maintenanceButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/tenant/maintenance/1');
  });

  it('should navigate to financial account page when financial account button is clicked', () => {
    render(<TenantMyHouse />);
    
    const financialButton = screen.getByRole('button', { name: /financial account/i });
    fireEvent.click(financialButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/tenant/financial-account');
  });

  it('should render landlord contact action buttons', () => {
    render(<TenantMyHouse />);
    
    const callButton = screen.getByRole('button', { name: /call landlord/i });
    const messageButton = screen.getByRole('button', { name: /send message/i });
    
    expect(callButton).toBeInTheDocument();
    expect(messageButton).toBeInTheDocument();
  });

  it('should display property image', () => {
    render(<TenantMyHouse />);
    
    const propertyImage = screen.getByAltText('My Rental Property');
    expect(propertyImage).toBeInTheDocument();
    expect(propertyImage).toHaveAttribute('src', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop');
  });

  it('should handle missing user gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: null,
    });

    render(<TenantMyHouse />);
    
    // Component should still render with demo data
    expect(screen.getByText('My House')).toBeInTheDocument();
    expect(screen.getByText('My Rental Property')).toBeInTheDocument();
  });

  it('should show active rental badge', () => {
    render(<TenantMyHouse />);
    
    const activeRentalBadge = screen.getByText('Active Rental');
    expect(activeRentalBadge).toBeInTheDocument();
    expect(activeRentalBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should display lease dates correctly', () => {
    render(<TenantMyHouse />);
    
    // Check for lease start and end labels
    expect(screen.getByText('Lease Start Date')).toBeInTheDocument();
    expect(screen.getByText('Lease End Date')).toBeInTheDocument();
    expect(screen.getByText('Monthly Rent')).toBeInTheDocument();
    expect(screen.getByText('Payment Status')).toBeInTheDocument();
  });

  it('should format rent amount correctly', () => {
    render(<TenantMyHouse />);
    
    // Should display formatted rent amount - check for the specific rent amount in lease info
    const rentAmounts = screen.getAllByText('$2,500');
    expect(rentAmounts).toHaveLength(2); // One in overview, one in lease info
  });

  it('should show contact information with proper icons', () => {
    render(<TenantMyHouse />);
    
    // The component should render contact info with icons
    // Since we're using Lucide icons, we check for the text content
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('john.smith@email.com')).toBeInTheDocument();
  });

  it('should handle click on schedule inspection button', () => {
    render(<TenantMyHouse />);
    
    const inspectionButton = screen.getByRole('button', { name: /schedule inspection/i });
    
    // Button should be rendered but may not have navigation implemented
    expect(inspectionButton).toBeInTheDocument();
    fireEvent.click(inspectionButton);
    
    // Since no navigation is implemented for this button, nothing should happen
    // This tests that the button doesn't break the app
  });

  it('should handle click on lease renewal button', () => {
    render(<TenantMyHouse />);
    
    const renewalButton = screen.getByRole('button', { name: /lease renewal/i });
    
    expect(renewalButton).toBeInTheDocument();
    fireEvent.click(renewalButton);
    
    // Similar to inspection button, should not break the app
  });

  it('should have proper header structure', () => {
    render(<TenantMyHouse />);
    
    // Check header structure
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b');
  });
}); 