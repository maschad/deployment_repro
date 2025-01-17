"use client";

import { TestContract, TestContractFactory } from "@/sway-api";
import contractIds from "@/sway-api/contract-ids.json";
import { FuelLogo } from "@/components/FuelLogo";
import { bn } from "fuels";
import { useState } from "react";
import { Link } from "@/components/Link";
import { Button } from "@/components/Button";
import toast from "react-hot-toast";
import { useActiveWallet } from "@/hooks/useActiveWallet";
import useAsync from "react-use/lib/useAsync";
import { CURRENT_ENVIRONMENT, DOCS_URL, Environments, FAUCET_LINK } from "@/lib";
import { Provider, Wallet } from "fuels";

const contractId =
  CURRENT_ENVIRONMENT === Environments.LOCAL ? contractIds.testContract : (process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ID as string); // Testnet Contract ID

export default function Home() {
  const { wallet, walletBalance, refreshWalletBalance } = useActiveWallet();
  const [contract, setContract] = useState<TestContract>();
  const [counter, setCounter] = useState<number>();

  /**
   * useAsync is a wrapper around useEffect that allows us to run asynchronous code
   * See: https://github.com/streamich/react-use/blob/master/docs/useAsync.md
   */
  useAsync(async () => {
    if (wallet) {
      // Create a new instance of the contract
      const testContract = new TestContract(contractId, wallet);
      setContract(testContract);

      // Read the current value of the counter
      const { value } = await testContract.functions.get_count().get();
      setCounter(value.toNumber());
    }
  }, [wallet]);

  const deployContract = async () => {
    const FUEL_NETWORK_URL = "http://127.0.0.1:4000/v1/graphql";

    try {
      // Create the provider
      const provider = await Provider.create(FUEL_NETWORK_URL);
      console.log("Provider initialized successfully");
      if (!wallet) {
        return;
      }
      // Create a factory instance with the correct `new` keyword
      const factory = new TestContractFactory(wallet);
      console.log("Factory instance created");

      // Deploy the contract using the factory instance
      const deployResult = await factory.deploy();
      console.log("Deploy initiated");

      // Wait for deployment results
      const { contract, transactionResult } = await deployResult.waitForResult();
      console.log("Contract deployed successfully with ID:", contract);
      console.log("Transaction ID:", transactionResult.id);

      return contract;
    } catch (error) {
      console.error("Error deploying contract:", error);
    }
  };

  // eslint-disable-next-line consistent-return
  const onIncrementPressed = async () => {
    const contract = await deployContract();
    if (!contract) {
      return;
    }
    // // Call the increment_counter function on the contract
    // const { waitForResult } = await contract.functions.increment_counter(bn(1)).call();

    // // Wait for the transaction to be mined, and then read the value returned
    // const { value } = await waitForResult();

    // setCounter(value.toNumber());

    // await refreshWalletBalance?.();
  };

  return (
    <>
      <div className="flex gap-4 items-center">
        <FuelLogo />
        <h1 className="text-2xl font-semibold ali">Welcome to Fuel</h1>
      </div>

      <span className="text-gray-400">
        Get started by editing <i>sway-programs/contract/main.sw</i> or <i>src/pages/index.tsx</i>.
      </span>

      <span className="text-gray-400">
        This template uses the new <Link href={`${DOCS_URL}/docs/fuels-ts/fuels/#fuels-cli`}>Fuels CLI</Link> to enable type-safe
        hot-reloading for your Sway programs.
      </span>

      <>
        <h3 className="text-xl font-semibold">Counter</h3>

        <span data-testid="counter" className="text-gray-400 text-6xl">
          {counter}
        </span>

        <Button onClick={onIncrementPressed} className="mt-6">
          Increment Counter
        </Button>
      </>

      <Link href="/predicate" className="mt-4">
        Predicate Example
      </Link>

      <Link href="/script" className="mt-4">
        Script Example
      </Link>
      <Link href={DOCS_URL} target="_blank" className="mt-12">
        Fuel Docs
      </Link>
    </>
  );
}
