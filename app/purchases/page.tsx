// pages/leaderboard/page.tsx
import Layout from '../../components/Layout/Layout';
import Purchases from '../../components/Dashboard/DashboardComponents/Purchases/Purchases';

const purchases = () => {
  return (
    <Layout>
      <Purchases />
    </Layout>
  );
};

export default purchases;
