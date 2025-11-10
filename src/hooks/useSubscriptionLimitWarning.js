import { useEffect, useRef } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useToast } from '../context/ToastContext';

export const useSubscriptionLimitWarning = () => {
  const { subjectUsage, studentUsage, isNearLimit } = useSubscription();
  const toast = useToast();
  const hasShownSubjectWarning = useRef(false);
  const hasShownStudentWarning = useRef(false);

  useEffect(() => {
    // Show warning when approaching subject limit (80%)
    if (isNearLimit('subject') && !hasShownSubjectWarning.current) {
      toast.warning(
        `⚠️ You're using ${subjectUsage.percentage}% of your subject limit. Consider upgrading your plan.`,
        7000
      );
      hasShownSubjectWarning.current = true;
    }

    // Reset warning flag if usage drops below threshold
    if (subjectUsage.percentage < 80) {
      hasShownSubjectWarning.current = false;
    }
  }, [subjectUsage.percentage, isNearLimit, toast]);

  useEffect(() => {
    // Show warning when approaching student limit (80%)
    if (isNearLimit('student') && !hasShownStudentWarning.current) {
      toast.warning(
        `⚠️ You're using ${studentUsage.percentage}% of your student limit. Consider upgrading your plan.`,
        7000
      );
      hasShownStudentWarning.current = true;
    }

    // Reset warning flag if usage drops below threshold
    if (studentUsage.percentage < 80) {
      hasShownStudentWarning.current = false;
    }
  }, [studentUsage.percentage, isNearLimit, toast]);

  const showLimitReachedError = (type) => {
    const limitType = type === 'subject' ? 'subject' : 'student';
    const usage = type === 'subject' ? subjectUsage : studentUsage;
    
    toast.error(
      `❌ You've reached your ${limitType} limit (${usage.current}/${usage.limit}). Upgrade your plan to add more.`,
      8000
    );
  };

  return {
    showLimitReachedError
  };
};
