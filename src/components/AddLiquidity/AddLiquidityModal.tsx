import React from 'react';
import styled from 'styled-components';
import PoolOverview from '../Common/PoolOverview';
import Button from '../Common/Button';
import AddAssetTable from './AddAssetTable';
import {observer} from 'mobx-react';
import {useStores} from '../../contexts/storesContext';
import {Pool, PoolToken} from '../../types';
import {ContractTypes} from "../../stores/Provider";
import {ModalMode} from "../../stores/AddLiquidityForm";

const Container = styled.div`
    display: block;
    position: fixed;
    z-index: 5;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0, 0, 0);
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
`;

const ModalContent = styled.div`
    position: relative;
    margin: 15% auto;
    display: flex;
    flex-direction: column;
    max-width: 862px;
    background-color: var(--panel-background);
    border: 1px solid var(--panel-border);
    border-radius: 4px;
    color: white;
`;

const AddLiquidityHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 68px;
    padding: 0px 20px;
    background-color: var(--panel-header-background);
    color: var(--header-text);
    border-bottom: 1px solid var(--panel-border);
    padding: 0px 20px 0px 20px;
`;

const AddLiquidityBody = styled.div`
    padding: 0px 20px 32px 20px;
`;

const HeaderContent = styled.div``;

const ExitComponent = styled.div`
    color: var(--exit-modal-color);
    transform: rotate(135deg);
    font-size: 22px;
    cursor: pointer;
`;

const AddLiquidityContent = styled.div`
    display: flex;
    flex-direction: row;
`;

const Notification = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    width: 100%;
    border: 1px solid var(--panel-border);
    background: var(--panel-background);
    margin-top: 20px;
    margin-bottom: 30px;
`;

enum ButtonAction {
    UNLOCK,
    ADD_LIQUIDITY,
    REMOVE_LIQUIDITY
}

interface Props {
    poolAddress: string;
}

const AddLiquidityModal = observer((props: Props) => {
    const findLockedToken = (
        pool: Pool,
        account: string
    ): PoolToken | undefined => {
        return pool.tokens.find(token => {
            return !tokenStore.hasMaxApproval(
                token.address,
                account,
                pool.address
            );
        });
    };

    const { poolAddress } = props;
    const {
        root: { poolStore, tokenStore, providerStore, addLiquidityFormStore },
    } = useStores();

    const web3React = providerStore.getActiveWeb3React();
    const { account } = web3React;

    const pool = poolStore.getPool(poolAddress);

    let loading = true;
    let lockedToken: PoolToken | undefined = undefined;

    if (pool && !account) {
        loading = false;
    }

    if (pool && account) {
        const accountApprovalsLoaded = tokenStore.areAccountApprovalsLoaded(
            poolStore.getPoolTokens(pool.address),
            account,
            pool.address
        );

        if (accountApprovalsLoaded) {
            loading = false;
            lockedToken = findLockedToken(pool, account);
        }
    }

    const actionButtonHandler = async (
        action: ButtonAction,
        token?: PoolToken
    ) => {
        if (action === ButtonAction.UNLOCK) {
            await tokenStore.approveMax(web3React, token.address, pool.address);
        } else if (action === ButtonAction.ADD_LIQUIDITY) {
            // Add Liquidity
            console.log('pre-contract');

            const { account } = web3React;

            const contract = providerStore.getContract(
                web3React,
                ContractTypes.BPool,
                poolAddress,
                account
            );

            const poolTokens = poolStore.calcPoolTokensByRatio(addLiquidityFormStore.joinRatio).toString();

            const inputs = addLiquidityFormStore.formatInputsForJoin();
            console.log('joinPool', {
                poolTokens: poolTokens.toString(),
                inputs: addLiquidityFormStore.formatInputsForJoin()
            });

            await contract.joinPool(poolTokens, inputs);

            // await poolStore.joinPool(web3React, pool.address, addLiquidityFormStore.joinRatio, addLiquidityFormStore.formatInputsForJoin())
        }
    };

    const renderNotification = () => {
        if (!account) {
            return (
                <Notification>
                    Connect wallet to add liqudity
                </Notification>
            );
        }
        if (lockedToken) {
            return (
                <Notification>
                    Please unlock {lockedToken.symbol} to continue
                </Notification>
            );
        } else {
            return <React.Fragment />;
        }
    };

    const renderActionButton = () => {
        if (lockedToken && addLiquidityFormStore.modalMode === ModalMode.ADD_LIQUIDITY) {
            return (
                <Button
                    buttonText={`Unlock ${lockedToken.symbol}`}
                    active={!!account}
                    onClick={e =>
                        actionButtonHandler(ButtonAction.UNLOCK, lockedToken)
                    }
                />
            );
        } else if (addLiquidityFormStore.modalMode === ModalMode.ADD_LIQUIDITY) {
            return (
                <Button
                    buttonText={`Add Liquidity`}
                    active={account && !addLiquidityFormStore.hasInputExceedUserBalance}
                    onClick={e =>
                        actionButtonHandler(ButtonAction.ADD_LIQUIDITY)
                    }
                />
            );
        } else if (addLiquidityFormStore.modalMode === ModalMode.REMOVE_LIQUIDITY) {
            return (
                <Button
                    buttonText={`Remove Liquidity`}
                    //TODO: Add this for remove liquidity: When pool tokens <= that!
                    active={!addLiquidityFormStore.hasInputExceedUserBalance}
                    onClick={e =>
                        actionButtonHandler(ButtonAction.REMOVE_LIQUIDITY)
                    }
                />
            );
        }
    };

    const modalOpen = addLiquidityFormStore.modalOpen;

    return (
        <Container style={{ display: modalOpen ? 'block' : 'none' }}>
            <ModalContent>
                <AddLiquidityHeader>
                    <HeaderContent>Add Liquidity</HeaderContent>
                    <ExitComponent
                        onClick={() => addLiquidityFormStore.closeModal()}
                    >
                        +
                    </ExitComponent>
                </AddLiquidityHeader>
                <AddLiquidityBody>
                    <AddLiquidityContent>
                        <PoolOverview poolAddress={poolAddress} />
                        <AddAssetTable poolAddress={poolAddress} />
                    </AddLiquidityContent>
                    {loading ? (
                        <div>Loading</div>
                    ) : (
                        <React.Fragment>
                            {renderNotification()}
                            {renderActionButton()}
                        </React.Fragment>
                    )}
                </AddLiquidityBody>
            </ModalContent>
        </Container>
    );
});

export default AddLiquidityModal;
