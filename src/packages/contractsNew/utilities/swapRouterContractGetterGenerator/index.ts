import type { Provider } from '@ethersproject/abstract-provider';
import { Contract, ContractInterface, Signer } from 'ethers';
import getSwapRouterContractAddress from 'packages/contractsNew/getSwapRouterContractAddress';
import { ChainId } from 'types';

export interface SwapRouterContractGetterGeneratorInput {
  abi: ContractInterface;
}

export interface SwapRouterContractGetterInput {
  chainId: ChainId;
  comptrollerContractAddress: string;
  signerOrProvider: Signer | Provider;
}

export type SwapRouterContractGetter<TContract extends Contract> = (
  input: SwapRouterContractGetterInput,
) => TContract | undefined;

export const swapRouterContractGetterGenerator = <TContract extends Contract>({
  abi,
}: SwapRouterContractGetterGeneratorInput) => {
  const getter: SwapRouterContractGetter<TContract> = ({
    chainId,
    signerOrProvider,
    comptrollerContractAddress,
  }) => {
    const address = getSwapRouterContractAddress({ chainId, comptrollerContractAddress });
    return address ? (new Contract(address, abi, signerOrProvider) as TContract) : undefined;
  };

  return getter;
};

export default swapRouterContractGetterGenerator;
