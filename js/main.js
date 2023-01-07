const SBT_ITEM_CODE = 'te6cckECEwEAAzsAART/APSkE/S88sgLAQIBYgIDAgLOBAUCASAPEAS9RsIiDHAJFb4AHQ0wP6QDDwAvhCs44cMfhDAccF8uGV+kAB+GTUAfhm+kAw+GVw+GfwA+AC0x8CcbDjAgHTP4IQ0MO/6lIwuuMCghAE3tFIUjC64wIwghAvyyaiUiC6gGBwgJAgEgDQ4AlDAx0x+CEAUkx64Suo450z8wgBD4RHCCEMGOhtJVA22AQAPIyx8Syz8hbrOTAc8XkTHiyXEFyMsFUATPFlj6AhPLaszJAfsAkTDiAMJsEvpA1NMAMPhH+EHIy/9QBs8W+ETPFhLMFMs/UjDLAAPDAJb4RlADzALegBB4sXCCEA3WB+NANRSAQAPIyx8Syz8hbrOTAc8XkTHiyXEFyMsFUATPFlj6AhPLaszJAfsAAMYy+ERQA8cF8uGR+kDU0wAw+Ef4QcjL//hEzxYTzBLLP1IQywABwwCU+EYBzN6AEHixcIIQBSTHrkBVA4BAA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wAD+o5AMfhByMv/+EPPFoAQcIIQi3cXNUAVUEQDgEADyMsfEss/IW6zkwHPF5Ex4slxBcjLBVAEzxZY+gITy2rMyQH7AOCCEB8EU3pSILrjAoIQb4n141Iguo4WW/hFAccF8uGR+EfAAPLhk/gj+GfwA+CCENE207NSILrjAjAxCgsMAJIx+EQixwXy4ZGAEHCCENUydtsQJFUCbYMGA8jLHxLLPyFus5MBzxeRMeLJcQXIywVQBM8WWPoCE8tqzMkB+wCLAvhkiwL4ZfADAI4x+EQixwXy4ZGCCvrwgHD7AoAQcIIQ1TJ22xAkVQJtgwYDyMsfEss/IW6zkwHPF5Ex4slxBcjLBVAEzxZY+gITy2rMyQH7AAAgghBfzD0UupPywZ3ehA/y8ABhO1E0NM/Afhh+kAB+GNw+GIg10nCAI4Wf/hi+kAB+GTUAfhm+kAB+GXTPzD4Z5Ew4oAA3PhH+Eb4QcjLP/hDzxb4RM8WzPhFzxbLP8ntVIAIBWBESAB28fn+AF8IXwg/CH8InwjQADbVjHgBfCLAADbewfgBfCPAtMqVw'
let USER_ADDRESS = ''
let transfer_link = ''

const timer = ms => new Promise(res => setTimeout(res, ms))

async function checkIsSBT(address) {
    await timer(10000)
    let source = await fetch(`https://api.ton.cat/v2/contracts/address/${address}/source`)
    source = await source.json()

    return source.code.base64 == SBT_ITEM_CODE
}

window.onload = () => {
    document.querySelector('#step1').addEventListener('click', async () => {
        let address = document.querySelector("#address")
        if (!address.value) {
            alert('Enter valid address!')
        } else {
            try {
                let addr = new TonWeb.Address(address.value).toString(true, true, true)
                USER_ADDRESS = addr
            } catch (e) {
                alert('Enter valid address!')
                return
            }

            document.querySelector('.step1').style.display = 'none'
            document.querySelector('.title').innerHTML = 'Getting your NFTs...'
            let nfts = await fetch(`https://tonapi.io/v1/nft/searchItems?owner=${USER_ADDRESS}&include_on_sale=true&limit=1000&offset=0`)
            nfts = await nfts.json()
            document.querySelector('.title').innerHTML = `Getting your NFTs... <span>0/${nfts.nft_items.length}</span>`
            let sbt = []

            for (let i in nfts.nft_items) {
                let item = nfts.nft_items[i]

                let isSBT = await checkIsSBT(item.address)
                if (isSBT) {
                    item.metadata.name = `${item.metadata.name.slice(0, 8)}`
                    sbt.push(item)
                }
                document.querySelector('.title').innerHTML = `Getting your NFTs... <span>${Number(i) + 1}/${nfts.nft_items.length}</span>`
            }

            if (sbt.length < 1) {
                alert(`You don't have a Soulbound NFT!`)
            }

            document.querySelector('.step2').style.display = 'block'
            document.querySelector('.title').innerHTML = 'Select <span>NFT</span> to burn'

            let nftsListHTML = ''

            for (let i in sbt) {
                nftsListHTML += `
                <div class='item' id='nftItem-${i}'>
                    <img src=${sbt[i].previews[sbt[i].previews.length - 1].url}>
                    <div class='nameBlock'>
                        <div class='name'>${sbt[i].metadata.name}</div>
                        <div class="button" id="burn-${i}">
                            Burn it
                        </div>
                    </div>
                </div>`
            }

            document.querySelector('.nfts').innerHTML = nftsListHTML

            for (let i in sbt) {
                document.querySelector(`#burn-${i}`).addEventListener('click', async () => {
                    let body = new TonWeb.boc.Cell()
                    body.bits.writeUint(0x1f04537a, 32); // OP
                    body.bits.writeUint(0, 64); // query_id

                    body = await body.toBoc()
                    body = ethereumjs.Buffer.Buffer.from(body).toString('base64')

                    transfer_link = `ton://transfer/${new TonWeb.Address(sbt[i].address).toString(true, true, true)}?amount=${0.05 * Math.pow(10, 9)}&bin=${body}`
                    document.querySelector('.step2').style.display = 'none'
                    document.querySelector('.step3').style.display = 'block'
                    document.querySelector('.qr').src = 'https://api.betkingy.com/qr?_=' + window.btoa(transfer_link)
                    document.querySelector('.title').innerHTML = `Scan QR code or click the button below to burn <span>NFT</span>`
                    document.querySelector('#openWallet').addEventListener('click', () => {
                        window.open(transfer_link)
                    })
                })
            }
        }
    })
}