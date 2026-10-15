import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type FlowStep = 'home' | 'review' | 'processing' | 'complete';
type PaymentMethod = 'card' | 'apple';

type DemoAccount = {
  username: string;
  displayName: string;
  initials: string;
  tagline: string;
};

type CoinPackage = {
  amount: number;
  price: number;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'Bulbert70',
    displayName: 'Bulbert70',
    initials: 'B',
    tagline: 'Sample creator account',
  },
  {
    username: 'The.Monke8',
    displayName: 'The.Monke8',
    initials: 'M',
    tagline: 'Sample creator account',
  },
];

const COIN_PACKAGES: CoinPackage[] = [
  { amount: 30, price: 0.31 },
  { amount: 350, price: 3.65 },
  { amount: 700, price: 7.25 },
  { amount: 1400, price: 14.49 },
  { amount: 3500, price: 36.2 },
  { amount: 15000, price: 150 },
  { amount: 30000, price: 300 },
  { amount: 45000, price: 450 },
];

const formatCoins = (amount: number) => amount.toLocaleString('en-US');
const formatCountdown = (remainingSeconds: number) =>
  `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(
    remainingSeconds % 60,
  ).padStart(2, '0')}`;
const formatPrice = (amount: number) =>
  `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function TikTokCoinIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="coin-icon-clip">
          <Path d="M0 0h48v48H0z" fill="#fff" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#coin-icon-clip)">
        <Path d="M48 24a24 24 0 1 1-48 0 24 24 0 0 1 48 0Z" fill="#FFB84D" />
        <Path d="M47 24a23 23 0 1 1-46 0 23 23 0 0 1 46 0Z" fill="#FFDE55" />
        <Path d="M42 24a18 18 0 1 1-36 0 18 18 0 0 1 36 0Z" fill="#F7A300" />
        <Path d="M42 24a18 18 0 1 1-36 0 18 18 0 0 1 36 0Z" fill="#F7A80F" />
        <Path d="M41.94 25.5a18 18 0 1 0-35.88 0 18 18 0 0 1 35.88 0Z" fill="#E88B00" />
        <Path d="M41.94 25.5a18 18 0 1 0-35.88 0 18 18 0 0 1 35.88 0Z" fill="#F09207" />
        <Path d="M34.74 17.77v5.86c-2.06 0-4.05-.44-5.81-1.55v7.2a7.79 7.79 0 0 1-7.84 7.75 7.79 7.79 0 0 1-7.8-8.35 7.79 7.79 0 0 1 9.19-8.24v6c-.47-.13-.9-.26-1.39-.26a3.14 3.14 0 0 0-3.09 2.5 3.14 3.14 0 0 0 3.1 2.5c1.74 0 3.14-1.4 3.14-3.11V12.03h4.69a5.6 5.6 0 0 0 5.81 5.74Z" fill="#F09207" />
        <Path d="M34.34 18.18a5.78 5.78 0 0 1-5.82-5.74h-3.87v15.63c0 1.94-1.6 3.5-3.56 3.5a3.53 3.53 0 0 1-3.55-3.5 3.53 3.53 0 0 1 4.52-3.38v-3.9a7.38 7.38 0 0 0-8.4 7.28 7.38 7.38 0 0 0 7.43 7.34c4.1 0 7.43-3.29 7.43-7.34v-7.98a9.73 9.73 0 0 0 5.82 1.92v-3.83Z" fill="#fff" />
      </G>
    </Svg>
  );
}

function DemoMark({ small = false }: { small?: boolean }) {
  return <TikTokCoinIcon size={small ? 36 : 46} />;
}

function DemoNotice({
  colors,
  compact = false,
}: {
  colors: ReturnType<typeof useColors>;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.notice,
        compact && styles.noticeCompact,
        { backgroundColor: colors.info },
      ]}
    >
      <Feather name="info" size={16} color={colors.infoForeground} />
      <Text style={[styles.noticeText, { color: colors.infoForeground }]}>
        {compact
          ? 'Demo only. No payment is processed or coins delivered.'
          : 'Demo only — sample accounts and prices are local examples. This app does not connect to TikTok or process payments.'}
      </Text>
    </View>
  );
}

export default function CoinRechargeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<FlowStep>('home');
  const [username, setUsername] = useState('');
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [searchError, setSearchError] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(3500);
  const [customCoins, setCustomCoins] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [countdown, setCountdown] = useState(5 * 60);
  const processingMotion = useRef(new Animated.Value(0)).current;

  const parsedCustomCoins = Number.parseInt(customCoins.replace(/,/g, ''), 10);
  const isCustomAmountValid =
    Number.isFinite(parsedCustomCoins) &&
    parsedCustomCoins >= 30 &&
    parsedCustomCoins <= 1_000_000;
  const coinAmount =
    selectedAmount === 'custom'
      ? isCustomAmountValid
        ? parsedCustomCoins
        : 0
      : selectedAmount;
  const selectedPackage =
    selectedAmount === 'custom'
      ? null
      : COIN_PACKAGES.find((pack) => pack.amount === selectedAmount) ?? null;
  const total =
    selectedPackage?.price ??
    (isCustomAmountValid ? parsedCustomCoins * 0.01034 : 0);
  const canContinue = Boolean(account && coinAmount > 0);

  useEffect(() => {
    if (step !== 'processing') return;

    setCountdown(5 * 60);
    const interval = setInterval(() => {
      setCountdown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    const finishTimer = setTimeout(() => {
      setCountdown((seconds) => Math.max(0, seconds - 1));
      setStep('complete');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(finishTimer);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 'processing') {
      processingMotion.stopAnimation();
      processingMotion.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(processingMotion, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(processingMotion, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [processingMotion, step]);

  const searchForAccount = () => {
    Keyboard.dismiss();
    const cleanedUsername = username.trim().replace(/^@/, '');
    if (!cleanedUsername) {
      setAccount(null);
      setSearchError('Enter a username to search.');
      return;
    }

    const match = DEMO_ACCOUNTS.find(
      (sample) => sample.username.toLowerCase() === cleanedUsername.toLowerCase(),
    );
    if (!match) {
      setAccount(null);
      setSearchError('No sample match. Try one of the demo accounts below.');
      return;
    }

    setUsername(match.username);
    setAccount(match);
    setSearchError('');
    Haptics.selectionAsync().catch(() => undefined);
  };

  const chooseSample = (sample: DemoAccount) => {
    setUsername(sample.username);
    setAccount(sample);
    setSearchError('');
    Keyboard.dismiss();
    Haptics.selectionAsync().catch(() => undefined);
  };

  const goToReview = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    setPaymentMethod('card');
    setStep('review');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
  };

  const startDemoPayment = () => {
    setCountdown(5 * 60);
    setStep('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
  };

  const resetToTopUp = () => {
    setStep('home');
    setSearchError('');
  };

  const safeTop = Platform.OS === 'web' ? 67 : insets.top;
  const safeBottom = Platform.OS === 'web' ? 34 : insets.bottom;
  const leftBallColor = processingMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.processingCyan, colors.primary],
  });
  const rightBallColor = processingMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.primary, colors.processingCyan],
  });
  const leftBallShift = processingMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });
  const rightBallShift = processingMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const leftBallScale = processingMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });
  const rightBallScale = processingMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  });

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: safeTop,
          paddingBottom: safeBottom,
        },
      ]}
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {step === 'review' ? (
          <ReviewScreen
            colors={colors}
            account={account}
            coinAmount={coinAmount}
            total={total}
            paymentMethod={paymentMethod}
            onSelectPayment={setPaymentMethod}
            onBack={() => setStep('home')}
            onPay={startDemoPayment}
          />
        ) : (
          <HomeScreen
            colors={colors}
            username={username}
            account={account}
            searchError={searchError}
            selectedAmount={selectedAmount}
            customCoins={customCoins}
            coinAmount={coinAmount}
            total={total}
            canContinue={canContinue}
            onChangeUsername={(value) => {
              setUsername(value);
              setAccount(null);
              setSearchError('');
            }}
            onSearch={searchForAccount}
            onChooseSample={chooseSample}
            onSelectAmount={(amount) => {
              setSelectedAmount(amount);
              Haptics.selectionAsync().catch(() => undefined);
            }}
            onChangeCustomCoins={setCustomCoins}
            onContinue={goToReview}
          />
        )}
      </KeyboardAvoidingView>

      {(step === 'processing' || step === 'complete') && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.overlay,
            { backgroundColor: colors.scrim },
          ]}
          accessibilityViewIsModal
        >
          {step === 'processing' ? (
            <View
              style={[
                styles.dialog,
                { backgroundColor: colors.card },
              ]}
              accessibilityRole="progressbar"
              accessibilityLabel="Simulating demo payment"
            >
              <View style={styles.loaderPair}>
                <Animated.View
                  style={[
                    styles.loaderDot,
                    styles.loaderDotLeft,
                    {
                      backgroundColor: leftBallColor,
                      transform: [
                        { translateX: leftBallShift },
                        { scale: leftBallScale },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.loaderDot,
                    styles.loaderDotRight,
                    {
                      backgroundColor: rightBallColor,
                      transform: [
                        { translateX: rightBallShift },
                        { scale: rightBallScale },
                      ],
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dialogTitle, { color: colors.foreground }]}>
                Processing demo payment…
              </Text>
              <Text style={[styles.dialogBody, { color: colors.mutedForeground }]}>
                This simulation advances to the demo result in about 2 seconds.
              </Text>
              <Text style={[styles.timer, { color: colors.primary }]}>
                {formatCountdown(countdown)}
              </Text>
              <Text style={[styles.dialogFootnote, { color: colors.mutedForeground }]}>
                No real payment is made and no coins are delivered.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.dialog,
                styles.successDialog,
                { backgroundColor: colors.card },
              ]}
              accessibilityRole="alert"
            >
              <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
                <Feather name="check" size={34} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.dialogTitle, { color: colors.foreground }]}>
                Demo complete
              </Text>
              <Text style={[styles.successSummary, { color: colors.foreground }]}>
                {formatCoins(coinAmount)} coins
                {account ? ` for @${account.username}` : ''}
              </Text>
              <Text style={[styles.dialogBody, { color: colors.mutedForeground }]}>
                This was only a simulation. No payment was processed and no coins were sent.
              </Text>
              <Pressable
                testID="success-back-button"
                onPress={resetToTopUp}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.86 : 1 },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
                  Back to top-up
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function HomeScreen({
  colors,
  username,
  account,
  searchError,
  selectedAmount,
  customCoins,
  coinAmount,
  total,
  canContinue,
  onChangeUsername,
  onSearch,
  onChooseSample,
  onSelectAmount,
  onChangeCustomCoins,
  onContinue,
}: {
  colors: ReturnType<typeof useColors>;
  username: string;
  account: DemoAccount | null;
  searchError: string;
  selectedAmount: number | 'custom';
  customCoins: string;
  coinAmount: number;
  total: number;
  canContinue: boolean;
  onChangeUsername: (value: string) => void;
  onSearch: () => void;
  onChooseSample: (sample: DemoAccount) => void;
  onSelectAmount: (amount: number | 'custom') => void;
  onChangeCustomCoins: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.brand}>
          <DemoMark small />
          <View>
            <Text style={[styles.brandTitle, { color: colors.foreground }]}>
              Get Coins
            </Text>
            <Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>
              CREATOR TOP-UP
            </Text>
          </View>
        </View>
        <View style={[styles.demoPill, { backgroundColor: colors.accent }]}>
          <View style={[styles.demoPip, { backgroundColor: colors.primary }]} />
          <Text style={[styles.demoPillText, { color: colors.accentForeground }]}>
            DEMO
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.homeContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            A LITTLE LOVE GOES A LONG WAY
          </Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Send coins to your favorite creators.
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            Explore a simple recharge flow with sample accounts and demo prices.
          </Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            TikTok username
          </Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Step 1 of 2
          </Text>
        </View>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.usernameInputWrap,
              { backgroundColor: colors.card, borderColor: searchError ? colors.destructive : colors.border },
            ]}
          >
            <Text style={[styles.atPrefix, { color: colors.mutedForeground }]}>@</Text>
            <TextInput
              testID="username-input"
              value={username}
              onChangeText={onChangeUsername}
              onSubmitEditing={onSearch}
              placeholder="Search a username"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="TikTok username"
              style={[styles.usernameInput, { color: colors.foreground }]}
            />
            {username.length > 0 && (
              <Pressable
                accessibilityLabel="Clear username"
                testID="clear-username-button"
                onPress={() => onChangeUsername('')}
                hitSlop={8}
                style={styles.clearButton}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable
            testID="search-account-button"
            onPress={onSearch}
            style={({ pressed }) => [
              styles.searchButton,
              { backgroundColor: colors.foreground, opacity: pressed ? 0.82 : 1 },
            ]}
            accessibilityRole="button"
          >
            <Feather name="search" size={15} color={colors.primaryForeground} />
            <Text style={[styles.searchButtonText, { color: colors.primaryForeground }]}>
              Search
            </Text>
          </Pressable>
        </View>
        {searchError ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{searchError}</Text>
        ) : null}
        {account ? (
          <View
            style={[
              styles.accountCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            testID="account-result"
          >
            <View style={[styles.avatar, { backgroundColor: colors.foreground }]}>
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                {account.initials}
              </Text>
            </View>
            <View style={styles.accountCopy}>
              <Text style={[styles.accountName, { color: colors.foreground }]}>
                @{account.username}
              </Text>
              <Text style={[styles.accountCaption, { color: colors.mutedForeground }]}>
                {account.tagline} · demo only
              </Text>
            </View>
            <View style={[styles.sampleCheck, { backgroundColor: colors.successSoft }]}>
              <Feather name="check" size={15} color={colors.success} />
            </View>
          </View>
        ) : (
          <View style={styles.sampleBlock}>
            <Text style={[styles.sampleLabel, { color: colors.mutedForeground }]}>
              Try a sample account
            </Text>
            <View style={styles.sampleChips}>
              {DEMO_ACCOUNTS.map((sample) => (
                <Pressable
                  key={sample.username}
                  testID={`sample-${sample.username}`}
                  onPress={() => onChooseSample(sample)}
                  style={({ pressed }) => [
                    styles.sampleChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.sampleChipText, { color: colors.foreground }]}>
                    @{sample.username}
                  </Text>
                  <Feather name="arrow-up-right" size={13} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
            <Text style={[styles.localLookupNote, { color: colors.mutedForeground }]}>
              Search matches these local examples only. Live account lookup is not connected.
            </Text>
          </View>
        )}

        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recharge
          </Text>
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Step 2 of 2
          </Text>
        </View>
        <Text style={[styles.packageHint, { color: colors.mutedForeground }]}>
          Choose a coin pack to preview your order.
        </Text>
        <View style={styles.packageGrid}>
          {COIN_PACKAGES.map((pack) => {
            const selected = selectedAmount === pack.amount;
            return (
              <Pressable
                key={pack.amount}
                testID={`package-${pack.amount}`}
                onPress={() => onSelectAmount(pack.amount)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.packageTile,
                  {
                    backgroundColor: selected ? colors.coinSoft : colors.card,
                    borderColor: selected ? colors.coin : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.packageAmountRow}>
                  <TikTokCoinIcon size={18} />
                  <Text style={[styles.packageAmount, { color: colors.foreground }]}>
                    {formatCoins(pack.amount)}
                  </Text>
                </View>
                <Text style={[styles.packagePrice, { color: colors.mutedForeground }]}>
                  {formatPrice(pack.price)}
                </Text>
                {selected && (
                  <View style={[styles.selectedDot, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={10} color={colors.primaryForeground} />
                  </View>
                )}
              </Pressable>
            );
          })}
          <Pressable
            testID="package-custom"
            onPress={() => onSelectAmount('custom')}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedAmount === 'custom' }}
            style={({ pressed }) => [
              styles.packageTile,
              {
                backgroundColor:
                  selectedAmount === 'custom' ? colors.coinSoft : colors.card,
                borderColor:
                  selectedAmount === 'custom' ? colors.coin : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <TikTokCoinIcon size={19} />
            <Text style={[styles.customTileLabel, { color: colors.foreground }]}>Custom</Text>
            {selectedAmount === 'custom' && (
              <View style={[styles.selectedDot, { backgroundColor: colors.primary }]}>
                <Feather name="check" size={10} color={colors.primaryForeground} />
              </View>
            )}
          </Pressable>
        </View>

        {selectedAmount === 'custom' && (
          <View style={[styles.customInputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.customInputCopy}>
              <Text style={[styles.customInputLabel, { color: colors.foreground }]}>
                Enter coin amount
              </Text>
              <Text style={[styles.customInputHint, { color: colors.mutedForeground }]}>
                30 to 1,000,000 coins
              </Text>
            </View>
            <View
              style={[
                styles.customAmountInputWrap,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <TikTokCoinIcon size={20} />
              <TextInput
                testID="custom-coins-input"
                value={customCoins}
                onChangeText={(value) => onChangeCustomCoins(value.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                placeholder="e.g. 5000"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.customCoinsInput, { color: colors.foreground }]}
                accessibilityLabel="Custom coin amount"
              />
            </View>
            {customCoins.length > 0 && !isValidCustomAmount(customCoins) && (
              <Text style={[styles.errorText, styles.customError, { color: colors.destructive }]}>
                Enter an amount between 30 and 1,000,000.
              </Text>
            )}
          </View>
        )}

        <DemoNotice colors={colors} />
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.totalCopy}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
            Total · {coinAmount > 0 ? `${formatCoins(coinAmount)} coins` : 'select an amount'}
          </Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>
            {formatPrice(total)}
          </Text>
        </View>
        <Pressable
          testID="continue-button"
          onPress={onContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              opacity: !canContinue ? 0.42 : pressed ? 0.84 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            Continue
          </Text>
          <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
        </Pressable>
        <Text style={[styles.bottomDisclaimer, { color: colors.mutedForeground }]}>
          Demo only · no payment will be made
        </Text>
      </View>
    </>
  );
}

function isValidCustomAmount(value: string) {
  const amount = Number.parseInt(value.replace(/,/g, ''), 10);
  return Number.isFinite(amount) && amount >= 30 && amount <= 1_000_000;
}

function ReviewScreen({
  colors,
  account,
  coinAmount,
  total,
  paymentMethod,
  onSelectPayment,
  onBack,
  onPay,
}: {
  colors: ReturnType<typeof useColors>;
  account: DemoAccount | null;
  coinAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  onSelectPayment: (method: PaymentMethod) => void;
  onBack: () => void;
  onPay: () => void;
}) {
  return (
    <>
      <View style={[styles.reviewHeader, { borderBottomColor: colors.border }]}>
        <Pressable
          testID="review-back-button"
          onPress={onBack}
          accessibilityLabel="Back to coin packs"
          hitSlop={10}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.reviewHeaderTitle, { color: colors.foreground }]}>
          Order summary
        </Text>
        <View style={[styles.demoPill, { backgroundColor: colors.accent }]}>
          <Text style={[styles.demoPillText, { color: colors.accentForeground }]}>
            DEMO
          </Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.reviewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.checkoutBanner, { backgroundColor: colors.successSoft }]}>
          <Feather name="shield" size={17} color={colors.success} />
          <Text style={[styles.checkoutBannerText, { color: colors.foreground }]}>
            Sandbox checkout · nothing is charged
          </Text>
        </View>

        <Text style={[styles.reviewSectionLabel, { color: colors.mutedForeground }]}>
          ACCOUNT
        </Text>
        <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
              {account?.initials ?? '?'}
            </Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={[styles.accountName, { color: colors.foreground }]}>
              @{account?.username ?? 'Sample account'}
            </Text>
            <Text style={[styles.accountCaption, { color: colors.mutedForeground }]}>
              Sample account · not connected
            </Text>
          </View>
          <View style={styles.orderSummaryValues}>
            <Text style={[styles.orderCoins, { color: colors.foreground }]}>
              {formatCoins(coinAmount)} coins
            </Text>
            <Text style={[styles.orderPrice, { color: colors.foreground }]}>
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        <Text style={[styles.reviewSectionLabel, { color: colors.mutedForeground }]}>
          PAYMENT METHOD
        </Text>
        <Pressable
          testID="payment-method-card"
          onPress={() => onSelectPayment('card')}
          accessibilityRole="button"
          accessibilityState={{ selected: paymentMethod === 'card' }}
          style={({ pressed }) => [
            styles.paymentChoice,
            {
              backgroundColor: colors.card,
              borderColor: paymentMethod === 'card' ? colors.infoForeground : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[styles.paymentIcon, { backgroundColor: colors.muted }]}>
            <Feather name="credit-card" size={18} color={colors.foreground} />
          </View>
          <Text style={[styles.paymentName, { color: colors.foreground }]}>
            Credit or debit card
          </Text>
          <Text style={[styles.paymentDemoLabel, { color: colors.mutedForeground }]}>
            demo
          </Text>
          <View
            style={[
              styles.radioOuter,
              { borderColor: paymentMethod === 'card' ? colors.infoForeground : colors.border },
            ]}
          >
            {paymentMethod === 'card' && (
              <View style={[styles.radioInner, { backgroundColor: colors.infoForeground }]} />
            )}
          </View>
        </Pressable>
        <Pressable
          testID="payment-method-apple"
          onPress={() => onSelectPayment('apple')}
          accessibilityRole="button"
          accessibilityLabel="Apple Pay demo"
          accessibilityState={{ selected: paymentMethod === 'apple' }}
          style={({ pressed }) => [
            styles.paymentChoice,
            {
              backgroundColor: colors.card,
              borderColor: paymentMethod === 'apple' ? colors.infoForeground : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.applePayMark} accessibilityLabel="Apple Pay">
            <Image
              source={require('../assets/images/apple-pay-symbol.png')}
              style={styles.applePayIcon}
              resizeMode="contain"
              accessibilityLabel="Apple logo"
            />
            <Text style={[styles.applePayWordmark, { color: colors.foreground }]}>
              Apple{"\n"}Pay
            </Text>
          </View>
          <View style={styles.paymentNameSpacer} />
          <Text style={[styles.paymentDemoLabel, { color: colors.mutedForeground }]}>
            demo
          </Text>
          <View
            style={[
              styles.radioOuter,
              { borderColor: paymentMethod === 'apple' ? colors.infoForeground : colors.border },
            ]}
          >
            {paymentMethod === 'apple' && (
              <View style={[styles.radioInner, { backgroundColor: colors.infoForeground }]} />
            )}
          </View>
        </Pressable>

        <Text style={[styles.paymentDisclaimer, { color: colors.mutedForeground }]}>
          This screen is a visual simulation. No card details are collected, no payment provider is contacted, and no coins are delivered.
        </Text>

        <DemoNotice colors={colors} compact />
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          styles.reviewBottomBar,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.reviewTotalRow}>
          <Text style={[styles.reviewTotalLabel, { color: colors.foreground }]}>Total</Text>
          <Text style={[styles.reviewTotalValue, { color: colors.foreground }]}>
            {formatPrice(total)}
          </Text>
        </View>
        <Pressable
          testID="pay-demo-button"
          onPress={onPay}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.payButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.84 : 1 },
          ]}
          accessibilityRole="button"
        >
          <Feather name="shield" size={17} color={colors.primaryForeground} />
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            Pay demo · {formatPrice(total)}
          </Text>
        </Pressable>
        <Text style={[styles.bottomDisclaimer, { color: colors.mutedForeground }]}>
          No transaction will be created
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  topBar: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  demoPill: {
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  demoPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  demoPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  homeContent: {
    paddingHorizontal: 20,
    paddingTop: 23,
    paddingBottom: 20,
  },
  hero: {
    paddingBottom: 22,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -1.1,
    maxWidth: 330,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 330,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.35,
  },
  sectionHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 9,
  },
  usernameInputWrap: {
    minHeight: 50,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
  },
  atPrefix: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginRight: 5,
  },
  usernameInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    flex: 1,
    minWidth: 40,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 3,
  },
  searchButton: {
    height: 50,
    minWidth: 92,
    borderRadius: 13,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
  },
  sampleBlock: {
    paddingTop: 14,
  },
  sampleLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginBottom: 8,
  },
  sampleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleChip: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 11,
  },
  sampleChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  localLookupNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },
  accountCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  accountCopy: {
    flex: 1,
    marginLeft: 11,
  },
  accountName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  accountCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 3,
  },
  sampleCheck: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 19,
    marginBottom: 18,
  },
  packageHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: -3,
    marginBottom: 12,
  },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  packageTile: {
    width: '31.5%',
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 13,
    marginBottom: 9,
    position: 'relative',
  },
  packageAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  packageAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  packagePrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 6,
  },
  selectedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTileLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginTop: 5,
  },
  customInputCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginTop: 3,
  },
  customInputCopy: {
    marginBottom: 10,
  },
  customInputLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  customInputHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 3,
  },
  customAmountInputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
  },
  customCoinsInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 0,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  customError: {
    marginTop: 5,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  noticeCompact: {
    marginTop: 15,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalCopy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  totalLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  totalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 16,
  },
  continueButton: {
    width: '100%',
  },
  primaryButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  bottomDisclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
  },
  reviewHeader: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 34,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  reviewHeaderTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  reviewContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  checkoutBanner: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 13,
    paddingHorizontal: 13,
    marginBottom: 24,
  },
  checkoutBannerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  reviewSectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 9,
  },
  orderCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 25,
  },
  orderSummaryValues: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  orderCoins: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  orderPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    marginTop: 4,
  },
  paymentChoice: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: 13,
    paddingHorizontal: 11,
    marginBottom: 9,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  applePayMark: {
    width: 82,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  applePayIcon: {
    width: 20,
    height: 24,
  },
  applePayWordmark: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 15,
    letterSpacing: -0.2,
  },
  paymentNameSpacer: {
    flex: 1,
  },
  paymentName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
  },
  paymentDemoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginRight: 10,
  },
  radioOuter: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  paymentDisclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 7,
    marginTop: 8,
  },
  reviewBottomBar: {
    paddingTop: 14,
  },
  reviewTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  reviewTotalLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  reviewTotalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  payButton: {
    width: '100%',
  },
  overlay: {
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 25,
  },
  loaderPair: {
    width: 88,
    height: 56,
    position: 'relative',
    marginBottom: 28,
  },
  loaderDot: {
    position: 'absolute',
    top: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  loaderDotLeft: {
    left: 0,
    zIndex: 1,
  },
  loaderDotRight: {
    right: 0,
    zIndex: 2,
  },
  dialogTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  dialogBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
  },
  timer: {
    fontFamily: 'Inter_700Bold',
    fontSize: 19,
    marginTop: 16,
  },
  dialogFootnote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 13,
  },
  successDialog: {
    paddingTop: 33,
    paddingBottom: 28,
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },
  successSummary: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 14,
  },
});
