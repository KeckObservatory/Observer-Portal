#!/usr/bin/env python3
"""
Test script to verify that URLs in urls.json return HTTP 200 status codes.
"""
import json
import requests
from pathlib import Path
from typing import Dict, List, Tuple


def load_urls(json_file: str = "../src/urls.json") -> Dict[str, str]:
    """Load URLs from JSON file."""
    json_path = Path(__file__).parent / json_file
    with open(json_path, 'r') as f:
        return json.load(f)


def is_full_url(url: str) -> bool:
    """Check if the URL is a full URL (starts with http:// or https://)."""
    return url.startswith(('http://', 'https://'))


def test_url(key: str, url: str, timeout: int = 10) -> Tuple[str, bool, int, str]:
    """
    Test a single URL and return the result.
    
    Returns:
        Tuple of (key, success, status_code, message)
    """
    if not url:
        return (key, False, 0, "Empty URL - skipped")
    
    if not is_full_url(url):
        return (key, False, 0, f"Relative URL - skipped")
    
    try:
        response = requests.get(url, timeout=timeout, allow_redirects=True)
        if response.status_code == 200:
            return (key, True, response.status_code, "OK")
        else:
            return (key, False, response.status_code, f"Status: {response.status_code}")
    except requests.exceptions.Timeout:
        return (key, False, 0, "Timeout")
    except requests.exceptions.ConnectionError:
        return (key, False, 0, "Connection error")
    except requests.exceptions.RequestException as e:
        return (key, False, 0, f"Error: {str(e)}")


def test_all_urls(urls: Dict[str, str], timeout: int = 10) -> List[Tuple[str, bool, int, str]]:
    """Test all URLs and return results."""
    results = []
    for key, url in urls.items():
        result = test_url(key, url, timeout)
        results.append(result)
    return results


def print_results(results: List[Tuple[str, bool, int, str]]) -> None:
    """Print test results in a formatted manner."""
    print("\n" + "="*80)
    print("URL Test Results")
    print("="*80 + "\n")
    
    passed = []
    failed = []
    skipped = []
    
    for key, success, status_code, message in results:
        if "skipped" in message.lower():
            skipped.append((key, message))
        elif success:
            passed.append((key, status_code))
        else:
            failed.append((key, status_code, message))
    
    # Print passed tests
    if passed:
        print(f"✓ PASSED ({len(passed)}):")
        for key, status_code in passed:
            print(f"  ✓ {key} - {status_code}")
        print()
    
    # Print failed tests
    if failed:
        print(f"✗ FAILED ({len(failed)}):")
        for key, status_code, message in failed:
            print(f"  ✗ {key} - {message}")
        print()
    
    # Print skipped tests
    if skipped:
        print(f"⊘ SKIPPED ({len(skipped)}):")
        for key, message in skipped:
            print(f"  ⊘ {key} - {message}")
        print()
    
    # Print summary
    total = len(results)
    print("="*80)
    print(f"Summary: {len(passed)} passed, {len(failed)} failed, {len(skipped)} skipped out of {total} total")
    print("="*80 + "\n")


def main():
    """Main function to run URL tests."""
    print("Loading URLs from urls.json...")
    urls = load_urls()
    print(f"Found {len(urls)} URLs to test\n")
    
    print("Testing URLs (this may take a while)...")
    results = test_all_urls(urls, timeout=10)
    
    print_results(results)
    
    # Return exit code based on failures
    failed_count = sum(1 for _, success, _, msg in results if not success and "skipped" not in msg.lower())
    return 1 if failed_count > 0 else 0


if __name__ == "__main__":
    exit(main())
