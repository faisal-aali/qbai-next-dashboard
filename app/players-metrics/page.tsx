// pages/leaderboard/page.tsx
import Layout from '../../components/Layout/Layout';
import ManagePlayers from '@/components/Dashboard/DashboardComponents/ManagePlayers/ManagePlayers';

const PlayersMetrics = () => {
  return (
    <Layout>
      <ManagePlayers />
    </Layout>
  );
};

export default PlayersMetrics;
