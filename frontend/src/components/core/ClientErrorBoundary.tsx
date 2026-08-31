import {
  Button,
  Center,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Component, ErrorInfo, ReactNode } from "react";

type Props = {
  children: ReactNode;
  resetKey: string;
};

type State = { hasError: boolean };

class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Client page error", error, info);
  }

  componentDidUpdate(previousProps: Props) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Center mih="70vh" px="md">
        <Paper withBorder p="xl" radius="md" maw={520}>
          <Stack align="center">
            <Title order={3}>页面暂时没有正常加载</Title>
            <Text color="dimmed" align="center">
              你的文件数据没有受到影响。可以重新加载当前页面，或先返回文件首页。
            </Text>
            <Group>
              <Button variant="light" onClick={() => window.location.reload()}>
                重新加载
              </Button>
              <Button component="a" href="/">
                返回文件首页
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Center>
    );
  }
}

export default ClientErrorBoundary;
