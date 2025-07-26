#!/bin/bash
echo "🔧 Testing TypeScript compilation..."
cd /c/Users/guslo/Bitacora_01/frontend
npm run build 2>&1 | tee compile_output.txt
echo "📋 Compilation test completed. Check compile_output.txt for details."
