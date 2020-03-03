import React from 'react';
import styled from 'styled-components';
import PoolAssetChartPanel from '../components/Pool/PoolAssetChartPanel';
import AddRemovePanel from '../components/Pool/AddRemovePanel';
import InfoPanel from '../components/Pool/InfoPanel';
import BalancesTable from '../components/Pool/BalancesTable';
import AddLiquidityModal from '../components/AddLiquidity/AddLiquidityModal';
import { observer } from 'mobx-react';
import { useStores } from '../contexts/storesContext';
import {formatBalanceTruncated, formatFee, toWei} from '../utils/helpers';
import { getUserShareText } from '../components/Common/PoolOverview';

const PoolViewWrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 27px 25px 0px 25px;
`;

const InfoPanelWrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    justify-content: flex-start;
    div {
    }
`;

const SwapsTable = styled.div``;

const Pool = observer(() => {
    const poolAddress = '0xa25bA3D820e9b572c0018Bb877e146d76af6a9cF';
    const [modalOpen, setModalOpen] = React.useState({ state: false });
    const {
        root: { poolStore, providerStore, marketStore },
    } = useStores();
    const pool = poolStore.getPool(poolAddress);
    const { account } = providerStore.getActiveWeb3React();

    let poolSymbols;
    let poolBalances;

    if (pool) {
        poolSymbols = pool.tokens.map(token => token.symbol);
        poolBalances = pool.tokens.map(token => token.balance);
    };

    const feeText = pool ? formatFee(pool.swapFee) : '-';
    const shareText = getUserShareText(pool, account);
    const liquidityText = marketStore.assetPricesLoaded && pool ? formatBalanceTruncated(toWei(marketStore.getPortfolioValue(poolSymbols, poolBalances)), 4, 20): '-';

    return (
        <PoolViewWrapper>
            <AddLiquidityModal
                modalOpen={modalOpen}
                setModalOpen={setModalOpen}
                poolAddress={poolAddress}
            />
            <PoolAssetChartPanel poolAddress={poolAddress} />
            <AddRemovePanel
                setModalOpen={setModalOpen}
                poolAddress={poolAddress}
            />
            <InfoPanelWrapper>
                <InfoPanel text={`$ ${liquidityText}`} subText="Liquidity" />
                <InfoPanel
                    text="$ -"
                    subText="Trade Volume (24hr)"
                />
                <InfoPanel text={feeText} subText="Pool Swap Fee" />
                <InfoPanel text={shareText} subText="My Pool Share" />
            </InfoPanelWrapper>
            <BalancesTable poolAddress={poolAddress} />
            <SwapsTable />
        </PoolViewWrapper>
    );
});

export default Pool;