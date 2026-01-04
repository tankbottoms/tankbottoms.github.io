# IPFS Deployment

Last updated: 2026-01-03

## Current Deployments

### Full Site

| Field | Value |
|-------|-------|
| CID | `bafybeighbkig3ginwn7kb4mfoxyqfrtbm6bzsfoiz4cyfwbqgyb3lftigu` |
| IPNS Key | `mrwhiskers-blog` |
| IPNS Name | `k51qzi5uqu5djqjeph794cc53kvd9qt784kptanc2twsyto97ytyibg5m9b0us` |
| Server | http://spark-2.local:5001 |

### Redirect Page

| Field | Value |
|-------|-------|
| CID | `N/A` |
| IPNS Key | `mrwhiskers-blog-redirect` |
| IPNS Name | `N/A` |
| Server | N/A |

## Access URLs

### Full Site (IPFS - immutable)

- https://ipfs.pantsonfire.xyz/ipfs/bafybeighbkig3ginwn7kb4mfoxyqfrtbm6bzsfoiz4cyfwbqgyb3lftigu/
- https://ipfs1.shh-shush.xyz/ipfs/bafybeighbkig3ginwn7kb4mfoxyqfrtbm6bzsfoiz4cyfwbqgyb3lftigu/
- https://ipfs.io/ipfs/bafybeighbkig3ginwn7kb4mfoxyqfrtbm6bzsfoiz4cyfwbqgyb3lftigu/
- https://dweb.link/ipfs/bafybeighbkig3ginwn7kb4mfoxyqfrtbm6bzsfoiz4cyfwbqgyb3lftigu/

### Full Site IPNS (always latest)

- https://ipfs.pantsonfire.xyz/ipns/k51qzi5uqu5djqjeph794cc53kvd9qt784kptanc2twsyto97ytyibg5m9b0us/
- https://ipfs1.shh-shush.xyz/ipns/k51qzi5uqu5djqjeph794cc53kvd9qt784kptanc2twsyto97ytyibg5m9b0us/
- https://ipfs.io/ipns/k51qzi5uqu5djqjeph794cc53kvd9qt784kptanc2twsyto97ytyibg5m9b0us/
- https://dweb.link/ipns/k51qzi5uqu5djqjeph794cc53kvd9qt784kptanc2twsyto97ytyibg5m9b0us/

## ENS Configuration

### Full Site

Set content field to: `ipns://k51qzi5uqu5djqjeph794cc53kvd9qt784kptanc2twsyto97ytyibg5m9b0us`

- tankbottoms.eth

### Redirect

Set content field to: `ipns://IPNS_NAME`

- redirect.tankbottoms.eth
- about.tankbottoms.eth

## Deployment Notes

The site is built with SvelteKit's static adapter and all paths are converted to relative paths for IPFS compatibility. The IPNS key provides a stable address that can be updated without changing the ENS content hash.
