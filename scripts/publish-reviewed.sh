#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
repo=mariomlz99/ros2-basics-lab
review_branch=audit/kinenest-findings-2027
expected_origin=https://github.com/mariomlz99/ros2-basics-lab.git
[[ $(git remote get-url origin) == "$expected_origin" ]] || { echo 'Unexpected origin; inspect before publishing.' >&2; exit 1; }
[[ $(git branch --show-current) == "$review_branch" ]] || { echo 'Switch to the reviewed branch before publishing.' >&2; exit 1; }
[[ -z $(git status --porcelain) ]] || { echo 'Working tree has uncommitted changes; review them before publishing.' >&2; exit 1; }
candidate=$(git rev-parse HEAD)
git fetch origin main
git merge-base --is-ancestor origin/main "$candidate" || { echo 'Remote main advanced. Reconcile and review before publishing.' >&2; exit 1; }

wait_for_validation() {
  local branch=$1 run_id=''
  for attempt in $(seq 1 60); do
    run_id=$(gh run list --repo "$repo" --commit "$candidate" --branch "$branch" --limit 20 --json databaseId,name --jq '.[] | select(.name == "Lab release validation") | .databaseId' | head -1)
    [[ -z "$run_id" ]] || break
    sleep 5
  done
  [[ -n "$run_id" ]] || { echo 'Validation workflow did not appear; publication stopped.' >&2; return 1; }
  gh run watch "$run_id" --repo "$repo" --exit-status --interval 10
}

echo 'Pushing the review branch. Main will advance only after its browser checks pass.'
git push origin "$candidate:refs/heads/$review_branch"
wait_for_validation "$review_branch"
[[ $(git rev-parse HEAD) == "$candidate" && -z $(git status --porcelain) ]] || { echo 'Candidate changed during validation; publication stopped.' >&2; exit 1; }
git fetch origin main
git merge-base --is-ancestor origin/main "$candidate" || { echo 'Remote main changed during validation; publication stopped.' >&2; exit 1; }
git push origin "$candidate:refs/heads/main"
wait_for_validation main
echo "Published and live browser checks passed: $candidate"
echo 'https://mariomlz99.github.io/ros2-basics-lab/'
