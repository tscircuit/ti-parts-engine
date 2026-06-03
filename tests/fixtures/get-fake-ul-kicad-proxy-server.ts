import { afterEach } from "bun:test";
import { ULKiCadProxyServer } from "@tscircuit/fake-ul-kicad-proxy";

export type FakeUlKicadProxyTestServer = ULKiCadProxyServer;

type FakeUlKicadProxyTestServerContext = {
  server: FakeUlKicadProxyTestServer;
  url: string;
};

const testServers = new Set<ULKiCadProxyServer>();

afterEach(async () => {
  await Promise.all([...testServers].map((server) => server.stop()));
  testServers.clear();
});

export const getFakeUlKicadProxyTestServer =
  async (): Promise<FakeUlKicadProxyTestServerContext> => {
    const server = new ULKiCadProxyServer();
    await server.start();
    testServers.add(server);

    return {
      server,
      url: server.url,
    };
  };
