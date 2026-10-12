#!/usr/bin/env python3
"""
Edge-TTS synthesis helper script.
Usage: python3 server/tts_synthesize.py <text> <voice> <rate> <output_file>
Uses edge-tts Python library directly (not CLI) for better control.
"""
import sys
import asyncio
import edge_tts

async def synthesize(text: str, voice: str, rate: str, output: str) -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(output)

if __name__ == '__main__':
    if len(sys.argv) < 5:
        print("Usage: python3 tts_synthesize.py <text> <voice> <rate> <output_file>", file=sys.stderr)
        sys.exit(1)
    
    text = sys.argv[1]
    voice = sys.argv[2]
    rate = sys.argv[3]
    output = sys.argv[4]
    
    asyncio.run(synthesize(text, voice, rate, output))
    print(f"OK:{output}")
