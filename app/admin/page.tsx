"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Checkbox,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from '@heroui/react';
import { 
  Settings,
  Plus,
  Shield,
  Network,
  Layers,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { mockChains } from '@/lib/mock-data';
import { toast } from 'sonner';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
};

interface ProtocolConfig {
  id: string;
  chainSelector: string;
  protocol: string;
  strategy: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
}

interface ProtocolEntry {
  id: string;
  chainSelector: string;
  protocol: string;
  isAllowed: boolean;
  createdAt: Date;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('setAction');
  const [loading, setLoading] = useState(false);
  
  // Form states for setAction
  const [setActionForm, setSetActionForm] = useState({
    chainSelector: '',
    protocol: '',
    strategy: '',
    action: ''
  });

  // Form states for setStrategyAction
  const [setStrategyActionForm, setSetStrategyActionForm] = useState({
    chainSelector: '',
    protocol: '',
    strategy: '',
    action: ''
  });

  // Form states for setProtocol
  const [setProtocolForm, setSetProtocolForm] = useState({
    chainSelector: '',
    protocol: '',
    allowed: true
  });

  // Mock data for existing configurations
  const [protocolConfigs, setProtocolConfigs] = useState<ProtocolConfig[]>([
    {
      id: '1',
      chainSelector: '1',
      protocol: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
      strategy: '0x742d35Cc6634C0532925a3b8D',
      action: '1',
      isActive: true,
      createdAt: new Date('2024-01-15T10:30:00Z')
    },
    {
      id: '2',
      chainSelector: '137',
      protocol: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      strategy: '0x479e1B71A702a595e19b6d5932CD5c863ab57ee0',
      action: '2',
      isActive: true,
      createdAt: new Date('2024-01-14T15:20:00Z')
    }
  ]);

  const [protocolEntries, setProtocolEntries] = useState<ProtocolEntry[]>([
    {
      id: '1',
      chainSelector: '1',
      protocol: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
      isAllowed: true,
      createdAt: new Date('2024-01-15T10:30:00Z')
    },
    {
      id: '2',
      chainSelector: '137',
      protocol: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      isAllowed: false,
      createdAt: new Date('2024-01-14T15:20:00Z')
    }
  ]);

  const handleSetAction = async () => {
    setLoading(true);
    try {
      // Simulate contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newConfig: ProtocolConfig = {
        id: Date.now().toString(),
        chainSelector: setActionForm.chainSelector,
        protocol: setActionForm.protocol,
        strategy: setActionForm.strategy,
        action: setActionForm.action,
        isActive: true,
        createdAt: new Date()
      };
      
      setProtocolConfigs(prev => [newConfig, ...prev]);
      setSetActionForm({ chainSelector: '', protocol: '', strategy: '', action: '' });
      
      toast.success('Action configured successfully');
    } catch (error) {
      toast.error('Failed to configure action');
    } finally {
      setLoading(false);
    }
  };

  const handleSetStrategyAction = async () => {
    setLoading(true);
    try {
      // Simulate contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newConfig: ProtocolConfig = {
        id: Date.now().toString(),
        chainSelector: setStrategyActionForm.chainSelector,
        protocol: setStrategyActionForm.protocol,
        strategy: setStrategyActionForm.strategy,
        action: setStrategyActionForm.action,
        isActive: true,
        createdAt: new Date()
      };
      
      setProtocolConfigs(prev => [newConfig, ...prev]);
      setSetStrategyActionForm({ chainSelector: '', protocol: '', strategy: '', action: '' });
      
      toast.success('Strategy action configured successfully');
    } catch (error) {
      toast.error('Failed to configure strategy action');
    } finally {
      setLoading(false);
    }
  };

  const handleSetProtocol = async () => {
    setLoading(true);
    try {
      // Simulate contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newEntry: ProtocolEntry = {
        id: Date.now().toString(),
        chainSelector: setProtocolForm.chainSelector,
        protocol: setProtocolForm.protocol,
        isAllowed: setProtocolForm.allowed,
        createdAt: new Date()
      };
      
      setProtocolEntries(prev => [newEntry, ...prev]);
      setSetProtocolForm({ chainSelector: '', protocol: '', allowed: true });
      
      toast.success('Protocol configured successfully');
    } catch (error) {
      toast.error('Failed to configure protocol');
    } finally {
      setLoading(false);
    }
  };

  const getChainName = (chainSelector: string) => {
    const chain = mockChains.find(c => c.id.toString() === chainSelector);
    return chain ? chain.name : `Chain ${chainSelector}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8"
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-400 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Manage protocol configurations and strategy actions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="ondo-chip ondo-chip-success flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                <span>Admin Access</span>
              </div>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="ondo-metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Configurations</p>
                  <p className="text-2xl font-bold text-white">{protocolConfigs.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="ondo-metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Protocols</p>
                  <p className="text-2xl font-bold text-white">{protocolEntries.filter(p => p.isAllowed).length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Network className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="ondo-metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Supported Chains</p>
                  <p className="text-2xl font-bold text-white">{mockChains.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </Card>

            <Card className="ondo-metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Actions</p>
                  <p className="text-2xl font-bold text-white">{protocolConfigs.reduce((sum, config) => sum + parseInt(config.action), 0)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Configuration Forms */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mb-8"
        >
          <motion.div variants={fadeInUp}>
            <Card className="ondo-card">
              <CardHeader>
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-400" />
                  Protocol Configuration
                </h3>
              </CardHeader>
              <CardBody>
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  variant="underlined"
                  classNames={{
                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-white/10",
                    cursor: "w-full bg-blue-500",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-blue-400 text-gray-400"
                  }}
                >
                  <Tab key="setAction" title={
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Set Action</span>
                    </div>
                  }>
                    <div className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Chain Selector
                          </label>
                          <Select
                            placeholder="Select chain"
                            selectedKeys={setActionForm.chainSelector ? [setActionForm.chainSelector] : []}
                            onSelectionChange={(keys) => setSetActionForm(prev => ({ ...prev, chainSelector: Array.from(keys)[0] as string || '' }))}
                            classNames={{
                              trigger: "ondo-input-wrapper",
                              value: "text-white"
                            }}
                          >
                            {mockChains.map((chain) => (
                              <SelectItem key={chain.id.toString()} >
                                {chain.name} ({chain.id})
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Protocol Address
                          </label>
                          <Input
                            placeholder="0x..."
                            value={setActionForm.protocol}
                            onChange={(e) => setSetActionForm(prev => ({ ...prev, protocol: e.target.value }))}
                            classNames={{
                              input: "text-white bg-transparent",
                              inputWrapper: "ondo-input-wrapper"
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Strategy Address
                          </label>
                          <Input
                            placeholder="0x..."
                            value={setActionForm.strategy}
                            onChange={(e) => setSetActionForm(prev => ({ ...prev, strategy: e.target.value }))}
                            classNames={{
                              input: "text-white bg-transparent",
                              inputWrapper: "ondo-input-wrapper"
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Action ID
                          </label>
                          <Input
                            type="number"
                            placeholder="1"
                            value={setActionForm.action}
                            onChange={(e) => setSetActionForm(prev => ({ ...prev, action: e.target.value }))}
                            classNames={{
                              input: "text-white bg-transparent",
                              inputWrapper: "ondo-input-wrapper"
                            }}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleSetAction}
                        isLoading={loading && activeTab === 'setAction'}
                        className="ondo-button-primary"
                        startContent={!loading && <Save className="w-4 h-4" />}
                        isDisabled={!setActionForm.chainSelector || !setActionForm.protocol || !setActionForm.strategy || !setActionForm.action}
                      >
                        {loading && activeTab === 'setAction' ? 'Configuring...' : 'Set Action'}
                      </Button>
                    </div>
                  </Tab>

                  <Tab key="setStrategyAction" title={
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4" />
                      <span>Set Strategy Action</span>
                    </div>
                  }>
                    <div className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Chain Selector
                          </label>
                          <Select
                            placeholder="Select chain"
                            selectedKeys={setStrategyActionForm.chainSelector ? [setStrategyActionForm.chainSelector] : []}
                            onSelectionChange={(keys) => setSetStrategyActionForm(prev => ({ ...prev, chainSelector: Array.from(keys)[0] as string || '' }))}
                            classNames={{
                              trigger: "ondo-input-wrapper",
                              value: "text-white"
                            }}
                          >
                            {mockChains.map((chain) => (
                              <SelectItem key={chain.id.toString()} >
                                {chain.name} ({chain.id})
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Protocol Address
                          </label>
                          <Input
                            placeholder="0x..."
                            value={setStrategyActionForm.protocol}
                            onChange={(e) => setSetStrategyActionForm(prev => ({ ...prev, protocol: e.target.value }))}
                            classNames={{
                              input: "text-white bg-transparent",
                              inputWrapper: "ondo-input-wrapper"
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Strategy Address
                          </label>
                          <Input
                            placeholder="0x..."
                            value={setStrategyActionForm.strategy}
                            onChange={(e) => setSetStrategyActionForm(prev => ({ ...prev, strategy: e.target.value }))}
                            classNames={{
                              input: "text-white bg-transparent",
                              inputWrapper: "ondo-input-wrapper"
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Action ID
                          </label>
                          <Input
                            type="number"
                            placeholder="1"
                            value={setStrategyActionForm.action}
                            onChange={(e) => setSetStrategyActionForm(prev => ({ ...prev, action: e.target.value }))}
                            classNames={{
                              input: "text-white bg-transparent",
                              inputWrapper: "ondo-input-wrapper"
                            }}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleSetStrategyAction}
                        isLoading={loading && activeTab === 'setStrategyAction'}
                        className="ondo-button-primary"
                        startContent={!loading && <Save className="w-4 h-4" />}
                        isDisabled={!setStrategyActionForm.chainSelector || !setStrategyActionForm.protocol || !setStrategyActionForm.strategy || !setStrategyActionForm.action}
                      >
                        {loading && activeTab === 'setStrategyAction' ? 'Configuring...' : 'Set Strategy Action'}
                      </Button>
                    </div>
                  </Tab>

                  <Tab key="setProtocol" title={
                    <div className="flex items-center space-x-2">
                      <Network className="w-4 h-4" />
                      <span>Set Protocol</span>
                    </div>
                  }>
                    <div className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Chain Selector
                          </label>
                          <Select
                            placeholder="Select chain"
                            selectedKeys={setProtocolForm.chainSelector ? [setProtocolForm.chainSelector] : []}
                            onSelectionChange={(keys) => setSetProtocolForm(prev => ({ ...prev, chainSelector: Array.from(keys)[0] as string || '' }))}
                            classNames={{
                              trigger: "ondo-input-wrapper",
                              value: "text-white"
                            }}
                          >
                            {mockChains.map((chain) => (
                              <SelectItem key={chain.id.toString()} >
                                {chain.name} ({chain.id})
                              </SelectItem>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Protocol Address
                          </label>
                          <Input
                            placeholder="0x..."
                            value={setProtocolForm.protocol}
                            onChange={(e) => setSetProtocolForm(prev => ({ ...prev, protocol: e.target.value }))}
                            classNames={{
                              input: "text-white bg-transparent",
                              inputWrapper: "ondo-input-wrapper"
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Allowed Status
                          </label>
                          <div className="flex items-center space-x-4 mt-3">
                            <Checkbox
                              isSelected={setProtocolForm.allowed}
                              onValueChange={(checked) => setSetProtocolForm(prev => ({ ...prev, allowed: checked }))}
                              classNames={{
                                wrapper: "before:border-white/20"
                              }}
                            >
                              <span className="text-sm text-gray-400">Allow Protocol</span>
                            </Checkbox>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleSetProtocol}
                        isLoading={loading && activeTab === 'setProtocol'}
                        className="ondo-button-primary"
                        startContent={!loading && <Save className="w-4 h-4" />}
                        isDisabled={!setProtocolForm.chainSelector || !setProtocolForm.protocol}
                      >
                        {loading && activeTab === 'setProtocol' ? 'Configuring...' : 'Set Protocol'}
                      </Button>
                    </div>
                  </Tab>
                </Tabs>
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>

        {/* Configuration Tables */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid lg:grid-cols-2 gap-8"
        >
          {/* Protocol Configurations */}
          <motion.div variants={fadeInUp}>
            <Card className="ondo-card">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-400" />
                  Protocol Configurations
                </h3>
              </CardHeader>
              <CardBody className="p-0">
                <Table 
                  aria-label="Protocol configurations table"
                  classNames={{
                    wrapper: "bg-transparent shadow-none",
                    th: "ondo-table-header",
                    td: "ondo-table-row text-white border-b border-white/4"
                  }}
                >
                  <TableHeader>
                    <TableColumn>CHAIN</TableColumn>
                    <TableColumn>PROTOCOL</TableColumn>
                    <TableColumn>ACTION</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {protocolConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <span className="ondo-chip text-xs">
                            {getChainName(config.chainSelector)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-white">
                            {formatAddress(config.protocol)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-400">
                            #{config.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded flex items-center w-fit ${
                            config.isActive ? 'ondo-chip-success' : 'ondo-chip-danger'
                          }`}>
                            {config.isActive ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {config.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </motion.div>

          {/* Protocol Entries */}
          <motion.div variants={fadeInUp}>
            <Card className="ondo-card">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Network className="w-5 h-5 mr-2 text-purple-400" />
                  Protocol Entries
                </h3>
              </CardHeader>
              <CardBody className="p-0">
                <Table 
                  aria-label="Protocol entries table"
                  classNames={{
                    wrapper: "bg-transparent shadow-none",
                    th: "ondo-table-header",
                    td: "ondo-table-row text-white border-b border-white/4"
                  }}
                >
                  <TableHeader>
                    <TableColumn>CHAIN</TableColumn>
                    <TableColumn>PROTOCOL</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>CREATED</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {protocolEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <span className="ondo-chip text-xs">
                            {getChainName(entry.chainSelector)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-white">
                            {formatAddress(entry.protocol)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded flex items-center w-fit ${
                            entry.isAllowed ? 'ondo-chip-success' : 'ondo-chip-danger'
                          }`}>
                            {entry.isAllowed ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {entry.isAllowed ? 'Allowed' : 'Blocked'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-400">
                            {entry.createdAt.toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}