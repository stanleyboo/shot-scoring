import FeedbackForm from '@/components/FeedbackForm';

export const dynamic = 'force-dynamic';

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-yellow-300">Feedback</h1>
        <p className="text-sm text-stone-400">Suggest features, report issues, or ask questions.</p>
      </div>

      <FeedbackForm />
    </div>
  );
}
