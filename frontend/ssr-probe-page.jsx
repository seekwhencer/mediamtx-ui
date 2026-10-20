import { useQuery } from '@tanstack/react-query';
export default function ProbePage() {
  const q = useQuery({ queryKey: ['probe'], queryFn: async () => 'ok', retry: false });
  return <div>probe:{q.isPending ? 'pending' : q.data}</div>;
}
