"use client";

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from '@heroui/react';
import { Wallet, LogOut, User, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            className="ondo-button-secondary"
            startContent={<Avatar size="sm" className="w-4 h-4" />}
          >
            {formatAddress(address)}
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Wallet actions" className="ondo-card">
          <DropdownItem
            key="copy"
            startContent={<Copy className="w-4 h-4" />}
            onClick={handleCopyAddress}
          >
            Copy Address
          </DropdownItem>
          <DropdownItem
            key="profile"
            startContent={<User className="w-4 h-4" />}
            href="/profile"
          >
            View Profile
          </DropdownItem>
          <DropdownItem
            key="disconnect"
            startContent={<LogOut className="w-4 h-4" />}
            color="danger"
            onClick={() => disconnect()}
          >
            Disconnect
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          className="ondo-button-primary"
          startContent={<Wallet className="w-4 h-4" />}
        >
          Connect Wallet
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Connect wallet" className="ondo-card">
        {connectors.map((connector) => (
          <DropdownItem
            key={connector.uid}
            startContent={<Wallet className="w-4 h-4" />}
            onClick={() => connect({ connector })}
          >
            {connector.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}