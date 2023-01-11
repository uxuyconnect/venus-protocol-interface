/** @jsxImportSource @emotion/react */
import BigNumber from 'bignumber.js';
import { ConnectWallet, EnableToken, ModalProps, Spinner } from 'components';
import React, { useContext } from 'react';
import { useTranslation } from 'translation';
import { Asset, Pool, VToken } from 'types';
import { areTokensEqual, convertTokensToWei } from 'utilities';

import { useGetPool, useSupply } from 'clients/api';
import { AmountFormProps } from 'containers/AmountForm';
import { AuthContext } from 'context/AuthContext';
import useAssetInfo from 'hooks/useAssetInfo';
import useSuccessfulTransactionModal from 'hooks/useSuccessfulTransactionModal';

import { useStyles } from '../styles';
import SupplyForm from './form';

export interface SupplyProps {
  onClose: ModalProps['handleClose'];
  vToken: VToken;
  poolComptrollerAddress: string;
}

export interface SupplyUiProps extends Omit<SupplyProps, 'vToken' | 'poolComptrollerAddress'> {
  onSubmit: AmountFormProps['onSubmit'];
  isLoading: boolean;
  className?: string;
  asset?: Asset;
  pool?: Pool;
}

export const SupplyUi: React.FC<SupplyUiProps> = ({
  className,
  asset,
  pool,
  onSubmit,
  isLoading,
}) => {
  const styles = useStyles();

  const { t } = useTranslation();

  const assetInfo = useAssetInfo({
    asset,
    type: 'supply',
  });

  const maxInput = React.useMemo(() => {
    if (!asset) {
      return new BigNumber(0);
    }

    const maxInputTokens = asset.userWalletBalanceTokens;

    return maxInputTokens;
  }, [asset]);

  if (!asset) {
    return <></>;
  }

  return (
    <div className={className} css={styles.container}>
      <ConnectWallet message={t('supplyWithdraw.connectWalletToSupply')}>
        {asset && pool ? (
          <EnableToken
            token={asset.vToken.underlyingToken}
            spenderAddress={asset.vToken.address}
            title={t('supplyWithdraw.enableToSupply', {
              symbol: asset?.vToken.underlyingToken.symbol,
            })}
            assetInfo={assetInfo}
          >
            <SupplyForm
              key="form-supply"
              asset={asset}
              pool={pool}
              onSubmit={onSubmit}
              inputLabel={t('supplyWithdraw.walletBalance')}
              enabledButtonKey={t('supplyWithdraw.supply')}
              disabledButtonKey={t('supplyWithdraw.enterValidAmountSupply')}
              maxInput={maxInput}
              isTransactionLoading={isLoading}
            />
          </EnableToken>
        ) : (
          <Spinner />
        )}
      </ConnectWallet>
    </div>
  );
};

const SupplyModal: React.FC<SupplyProps> = ({ vToken, poolComptrollerAddress, onClose }) => {
  const { account: { address: accountAddress = '' } = {} } = useContext(AuthContext);

  const { data: getPoolData } = useGetPool({ poolComptrollerAddress, accountAddress });
  const pool = getPoolData?.pool;
  const asset = pool?.assets.find(item => areTokensEqual(item.vToken, vToken));

  const { t } = useTranslation();
  const { openSuccessfulTransactionModal } = useSuccessfulTransactionModal();

  const { mutateAsync: supply, isLoading: isSupplyLoading } = useSupply({
    vToken,
    accountAddress,
  });

  const onSubmit: AmountFormProps['onSubmit'] = async value => {
    const supplyAmountWei = convertTokensToWei({
      value: new BigNumber(value),
      token: vToken.underlyingToken,
    });
    const res = await supply({
      amountWei: supplyAmountWei,
    });
    onClose();

    openSuccessfulTransactionModal({
      title: t('supplyWithdraw.successfulSupplyTransactionModal.title'),
      content: t('supplyWithdraw.successfulSupplyTransactionModal.message'),
      amount: {
        valueWei: supplyAmountWei,
        token: vToken.underlyingToken,
      },
      transactionHash: res.transactionHash,
    });
  };

  return (
    <SupplyUi
      onClose={onClose}
      asset={asset}
      pool={pool}
      isLoading={isSupplyLoading}
      onSubmit={onSubmit}
    />
  );
};

export default SupplyModal;
