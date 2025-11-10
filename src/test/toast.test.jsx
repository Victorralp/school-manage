import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../context/ToastContext';
import ToastContainer from '../components/Toast/ToastContainer';

const wrapper = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('Toast System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add and display toast notifications', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.success('Test success message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test success message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('should support different toast types', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.success('Success');
      result.current.error('Error');
      result.current.warning('Warning');
      result.current.info('Info');
    });

    expect(result.current.toasts).toHaveLength(4);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('warning');
    expect(result.current.toasts[3].type).toBe('info');
  });

  it('should auto-dismiss toasts after duration', async () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.success('Test message', 1000);
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  it('should manually remove toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    let toastId;
    act(() => {
      toastId = result.current.success('Test message');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should render ToastContainer with toasts', () => {
    const TestComponent = () => {
      const toast = useToast();
      
      return (
        <>
          <button onClick={() => toast.success('Test toast')}>
            Show Toast
          </button>
          <ToastContainer />
        </>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Test toast')).toBeInTheDocument();
  });
});
