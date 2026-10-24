// Identical programs run in native Jazzy and browser CPython; no source rewriting.
const prefix=`import rclpy
from contextlib import contextmanager

@contextmanager
def scope():
    print('ENTER', flush=True)
    try:
        yield
    finally:
        print('EXIT', flush=True)

def main():
    rclpy.init()
    node = rclpy.create_node('spin_lifecycle')
    ticks = 0
    def tick():
        nonlocal ticks
        ticks += 1
        print('TICK', ticks, flush=True)
`;
const body=`    node.create_timer(0.05, tick)
    try:
        with scope():
            rclpy.spin(node)
            print('AFTER', flush=True)
    except ValueError as error:
        print('CAUGHT', str(error), flush=True)
    except KeyboardInterrupt:
        print('INTERRUPTED', flush=True)
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()
        print('FINALLY', flush=True)
    print('RETURN', flush=True)

main()
`;
export const spinFixtures={
 shutdown:prefix+`        if ticks == 3:
            rclpy.shutdown()
`+body,
 exception:prefix+`        raise ValueError('callback failed')
`+body,
 interrupt:prefix+body,
 finite:`import rclpy
rclpy.init()
node = rclpy.create_node('finite')
node.create_timer(0.01, lambda: print('UNEXPECTED CALLBACK'))
print('FINITE', flush=True)
`,
};
spinFixtures.sequential=spinFixtures.shutdown+'\nmain()\n';

spinFixtures.interrupt_error=spinFixtures.interrupt.replace("        print('FINALLY', flush=True)","        print('FINALLY', flush=True)\n        raise RuntimeError('cleanup failed')");
