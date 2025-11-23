import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getGameSettings, updateGameSettings, getGameStats } from '@/utils/storageMongo';
import { Rocket, TrendingUp, Zap, Dna, BarChart3, Settings2, RefreshCw } from 'lucide-react';

export function AdminGames() {
  const [settings, setSettings] = useState<any>({
    crash: { enabled: true, minBet: 10, maxBet: 10000, houseFactor: 0.97 },
    mines: { enabled: true, minBet: 10, maxBet: 10000, minMines: 1, maxMines: 24 },
    slots: { enabled: true, minBet: 10, maxBet: 10000, rtp: 0.95 },
    dice: { enabled: true, minBet: 10, maxBet: 10000, houseEdge: 0.02 }
  });

  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('settings');

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await getGameSettings();
    if (savedSettings && Object.keys(savedSettings).length > 0) {
      // Extract only the game settings (crash, mines, slots, dice)
      const cleanSettings = {
        crash: savedSettings.crash || { enabled: true, minBet: 10, maxBet: 10000, houseFactor: 0.97 },
        mines: savedSettings.mines || { enabled: true, minBet: 10, maxBet: 10000, minMines: 1, maxMines: 24 },
        slots: savedSettings.slots || { enabled: true, minBet: 10, maxBet: 10000, rtp: 0.95 },
        dice: savedSettings.dice || { enabled: true, minBet: 10, maxBet: 10000, houseEdge: 0.02 }
      };
      setSettings(cleanSettings);
    }
  };

  const loadStats = async () => {
    const gameStats = await getGameStats();
    setStats(gameStats);
  };

  const handleSave = async () => {
    try {
      await updateGameSettings(settings);
      toast.success('Game settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const handleReset = (gameName: string) => {
    const defaults: any = {
      crash: { enabled: true, minBet: 10, maxBet: 10000, houseFactor: 0.97 },
      mines: { enabled: true, minBet: 10, maxBet: 10000, minMines: 1, maxMines: 24 },
      slots: { enabled: true, minBet: 10, maxBet: 10000, rtp: 0.95 },
      dice: { enabled: true, minBet: 10, maxBet: 10000, houseEdge: 0.02 }
    };
    setSettings({ ...settings, [gameName]: defaults[gameName] });
    toast.info(`${gameName.toUpperCase()} settings reset to defaults`);
  };

  const updateSetting = (game: string, field: string, value: any) => {
    setSettings({
      ...settings,
      [game]: {
        ...settings[game],
        [field]: value
      }
    });
  };

  const gameIcons: any = {
    crash: <Rocket className="w-5 h-5" />,
    mines: <TrendingUp className="w-5 h-5" />,
    slots: <Zap className="w-5 h-5" />,
    dice: <Dna className="w-5 h-5" />
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Settings
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(settings).map(([game, config]: [string, any]) => (
              <Card key={game} className={!config.enabled ? 'opacity-60' : ''}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="capitalize flex items-center gap-2">
                      <span className="text-primary">{gameIcons[game]}</span>
                      {game}
                    </CardTitle>
                    <CardDescription>Configure game parameters</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch 
                      checked={config.enabled} 
                      onCheckedChange={(checked) => updateSetting(game, 'enabled', checked)}
                    />
                    <Badge variant={config.enabled ? 'default' : 'secondary'}>
                      {config.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Min Bet</Label>
                      <Input 
                        type="number" 
                        value={config.minBet} 
                        onChange={(e) => updateSetting(game, 'minBet', parseInt(e.target.value))}
                        disabled={!config.enabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Max Bet</Label>
                      <Input 
                        type="number" 
                        value={config.maxBet} 
                        onChange={(e) => updateSetting(game, 'maxBet', parseInt(e.target.value))}
                        disabled={!config.enabled}
                      />
                    </div>
                  </div>

                  {game === 'crash' && (
                    <div className="space-y-2">
                      <Label className="text-xs">House Factor (0-1)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="1"
                        value={config.houseFactor} 
                        onChange={(e) => updateSetting(game, 'houseFactor', parseFloat(e.target.value))}
                        disabled={!config.enabled}
                      />
                    </div>
                  )}

                  {game === 'mines' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Min Mines</Label>
                        <Input 
                          type="number" 
                          value={config.minMines} 
                          onChange={(e) => updateSetting(game, 'minMines', parseInt(e.target.value))}
                          disabled={!config.enabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Max Mines</Label>
                        <Input 
                          type="number" 
                          value={config.maxMines} 
                          onChange={(e) => updateSetting(game, 'maxMines', parseInt(e.target.value))}
                          disabled={!config.enabled}
                        />
                      </div>
                    </div>
                  )}

                  {game === 'slots' && (
                    <div className="space-y-2">
                      <Label className="text-xs">RTP - Return to Player (0-1)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="1"
                        value={config.rtp} 
                        onChange={(e) => updateSetting(game, 'rtp', parseFloat(e.target.value))}
                        disabled={!config.enabled}
                      />
                    </div>
                  )}

                  {game === 'dice' && (
                    <div className="space-y-2">
                      <Label className="text-xs">House Edge (0-1)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="1"
                        value={config.houseEdge} 
                        onChange={(e) => updateSetting(game, 'houseEdge', parseFloat(e.target.value))}
                        disabled={!config.enabled}
                      />
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2" 
                    onClick={() => handleReset(game)}
                  >
                    <RefreshCw className="w-3 h-3 mr-2" /> Reset to Defaults
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={async () => {
              const savedSettings = await getGameSettings();
              if (savedSettings && Object.keys(savedSettings).length > 0) {
                const cleanSettings = {
                  crash: savedSettings.crash || { enabled: true, minBet: 10, maxBet: 10000, houseFactor: 0.97 },
                  mines: savedSettings.mines || { enabled: true, minBet: 10, maxBet: 10000, minMines: 1, maxMines: 24 },
                  slots: savedSettings.slots || { enabled: true, minBet: 10, maxBet: 10000, rtp: 0.95 },
                  dice: savedSettings.dice || { enabled: true, minBet: 10, maxBet: 10000, houseEdge: 0.02 }
                };
                setSettings(cleanSettings);
                toast.info('Settings reloaded from storage');
              }
            }}>
              Cancel
            </Button>
            <Button size="lg" onClick={handleSave}>
              Save All Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Game Statistics</h3>
              <p className="text-sm text-muted-foreground">Real-time performance metrics</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadStats}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(stats).map(([game, data]: [string, any]) => (
                <Card key={game}>
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center gap-2">
                      <span className="text-primary">{gameIcons[game]}</span>
                      {game} Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Bets</p>
                          <p className="text-2xl font-bold">{data.totalBets.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Players</p>
                          <p className="text-2xl font-bold">{data.totalPlayers}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Wagered</p>
                          <p className="text-lg font-semibold text-blue-600">{data.totalWagered.toLocaleString()} pts</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Won</p>
                          <p className="text-lg font-semibold text-green-600">{data.totalWon.toLocaleString()} pts</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">House Profit</p>
                          <p className={`text-xl font-bold ${(data.totalWagered - data.totalWon) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(data.totalWagered - data.totalWon).toLocaleString()} pts
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Overall Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead className="text-right">Bets</TableHead>
                      <TableHead className="text-right">Wagered</TableHead>
                      <TableHead className="text-right">Won</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats).map(([game, data]: [string, any]) => (
                      <TableRow key={game}>
                        <TableCell className="font-medium capitalize">{game}</TableCell>
                        <TableCell className="text-right">{data.totalBets.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{data.totalWagered.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{data.totalWon.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {(data.totalWagered - data.totalWon).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}