import { sum } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, useRef, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { ShadowStack } from '../shadow-stack';

const { Value } = Animated;

const maxWidth = 300;
const horizontalMargin = 5;

let componentWidths = [];
let calculatedComponentWidths = 0;

let componentPositions = [];

const calculatePosition = () => {
  const widthSum = sum(componentWidths);
  const center = widthSum / 2;
  let w = 0;
  for (let i = 0; i < componentWidths.length; i++) {
    componentPositions[i] = w + componentWidths[i] / 2 - center;
    w += componentWidths[i];
  }
};

const springConfig = {
  damping: 38,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 600,
};

const AnimatedShadowStack = Animated.createAnimatedComponent(ShadowStack);

const MiniCoinIcon = styled(CoinIcon).attrs({
  alignSelf: 'center',
  size: 26,
})`
  margin-left: 7px;
`;

const CoinButtonShadow = [
  [0, 0, 9, colors.shadowGrey, 0.1],
  [0, 5, 15, colors.shadowGrey, 0.12],
  [0, 10, 30, colors.shadowGrey, 0.06],
];

const CoinText = styled(Text)`
  color: ${colors.alpha(colors.blueGreyDark, 0.5)};
  font-family: ${fonts.family.SFProRounded};
  font-size: ${fonts.size.large};
  font-weight: ${fonts.weight.semibold};
  height: 40px;
  letter-spacing: ${fonts.letterSpacing.looseyGoosey};
  line-height: 39px;
  margin-left: 6px;
  margin-right: 11px;
  text-align: center;
`;

const AddCashSelector = ({ currencies, initialCurrencyIndex, onSelect }) => {
  const translateX = useRef(new Value(0));
  const width = useRef(new Value(0));

  const [currentOption, setCurrentOption] = useState(initialCurrencyIndex);

  useEffect(() => {
    componentWidths = [];
    componentPositions = [];

    return () => {
      calculatedComponentWidths = 0;
    };
  }, []);

  const animateTransition = index => {
    Animated.spring(translateX.current, {
      toValue: componentPositions[index],
      ...springConfig,
    }).start();
    Animated.spring(width.current, {
      toValue: componentWidths[index] + horizontalMargin,
      ...springConfig,
    }).start();
  };

  const onSelectCurrency = index => {
    animateTransition(index);
    setCurrentOption(index);
    onSelect(currencies[index]);
  };

  const currencyItems = currencies.map((currency, index) => {
    return (
      <View
        key={index}
        onLayout={({ nativeEvent }) => {
          componentWidths[index] = nativeEvent.layout.width;
          calculatedComponentWidths++;
          if (currencies.length === calculatedComponentWidths) {
            calculatePosition();
            animateTransition(initialCurrencyIndex);
          }
        }}
      >
        <ButtonPressAnimation
          enableHapticFeedback={false}
          key={index}
          onPress={() => onSelectCurrency(index)}
          scaleTo={0.94}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            width: componentWidths[index],
          }}
        >
          <MiniCoinIcon symbol={currency} />
          <CoinText
            style={{
              color:
                currentOption === index
                  ? colors.alpha(colors.blueGreyDark, 0.7)
                  : colors.alpha(colors.blueGreyDark, 0.5),
            }}
          >
            {currency}
          </CoinText>
        </ButtonPressAnimation>
      </View>
    );
  });

  return (
    <Fragment>
      <AnimatedShadowStack
        borderRadius={20}
        height={40}
        marginLeft={4}
        marginRight={4}
        shadows={CoinButtonShadow}
        style={[
          {
            marginBottom: -40,
            zIndex: 10,
          },
          {
            transform: [{ translateX: translateX.current }],
            width: width.current,
          },
        ]}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          maxWidth,
          width: deviceUtils.dimensions.width,
          zIndex: 11,
        }}
      >
        {currencyItems}
      </View>
    </Fragment>
  );
};

AddCashSelector.propTypes = {
  currencies: PropTypes.array,
  initialCurrencyIndex: PropTypes.number,
  onSelect: PropTypes.func,
};

export default AddCashSelector;
