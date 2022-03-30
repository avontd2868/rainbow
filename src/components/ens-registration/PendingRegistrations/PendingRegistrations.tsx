import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import ButtonPressAnimation from '../../../components/animations/ButtonPressAnimation';
import ImageAvatar from '../../../components/contacts/ImageAvatar';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { RegistrationParameters } from '@rainbow-me/entities';
import {
  useENSPendingRegistrations,
  useENSRegistration,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

const PendingRegistration = ({
  registration,
}: {
  registration: RegistrationParameters;
}) => {
  const { navigate } = useNavigation();
  const { startRegistration } = useENSRegistration();

  const onFinish = useCallback(
    (name: string) => {
      startRegistration(name, 'create');
      navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {});
    },
    [navigate, startRegistration]
  );

  return (
    <Box>
      <Columns alignVertical="center">
        {registration.changedRecords?.avatar && (
          <Column width="content">
            <Box paddingRight="10px">
              <ImageAvatar
                image={registration.changedRecords?.avatar}
                size="small"
              />
            </Box>
          </Column>
        )}
        <Column>
          <Box>
            <Text color="primary" numberOfLines={1} size="16px" weight="heavy">
              {registration.name}
            </Text>
          </Box>
        </Column>
        <Column width="content">
          <Box paddingRight="15px">
            <ButtonPressAnimation
              onPress={() => onFinish(registration.name)}
              scaleTo={0.9}
            >
              <Box
                alignItems="center"
                as={LinearGradient}
                borderRadius={16}
                colors={colors.gradients.transparentToAppleBlue}
                end={{ x: 0.6, y: 0 }}
                height="30px"
                justifyContent="center"
                start={{ x: 0, y: 0.6 }}
              >
                <Inset horizontal="10px">
                  <AccentColorProvider color={colors.appleBlue}>
                    <Text color="accent" size="16px" weight="heavy">
                      Finish
                    </Text>
                  </AccentColorProvider>
                </Inset>
              </Box>
            </ButtonPressAnimation>
          </Box>
        </Column>
        <Column width="content">
          <ButtonPressAnimation onPress={() => null} scaleTo={0.9}>
            <Text color="secondary50" size="18px" weight="bold">
              􀈒
            </Text>
          </ButtonPressAnimation>
        </Column>
      </Columns>
    </Box>
  );
};

const PendingRegistrations = () => {
  const { pendingRegistrations } = useENSPendingRegistrations();

  return (
    <Box paddingHorizontal="19px">
      <Stack space="19px">
        <Text color="secondary50" size="14px" weight="bold">
          􀺉 In progress
        </Text>
        {pendingRegistrations.map(registration => (
          <PendingRegistration
            key={registration.name}
            registration={registration}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default PendingRegistrations;
